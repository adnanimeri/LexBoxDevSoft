// ===================================================================
// DOCUMENT TEMPLATE ROUTES
// ===================================================================
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { body, param } = require('express-validator');
const { validate: validateRequest } = require('../middleware/validation.middleware');
const DocumentTemplate = require('../models/DocumentTemplate');
const { Document, Dossier, Client, User, Organization, TimelineNode } = require('../models');
const path = require('path');
const fs = require('fs').promises;
const { encryptBuffer, deriveOrgKey } = require('../utils/encryption');

// ===================================================================
// HTML → SEGMENT PARSER (for PDF / DOCX rendering)
// ===================================================================
// Converts contentEditable HTML into flat array of:
//   { type:'text', text, bold, italic, underline, size, align }
//   { type:'newline' }
// Handles: <b>,<strong>,<i>,<em>,<u>,<font size=N>,<p>,<div>,<br>
// ===================================================================
function htmlToSegments(html) {
  const segments = [];

  const decode = (s) =>
    s.replace(/&amp;/g, '&')
     .replace(/&lt;/g, '<')
     .replace(/&gt;/g, '>')
     .replace(/&nbsp;/g, ' ')
     .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n));

  // HTML font-size command (1-7) → approximate pt size
  const htmlSizeToPt = [8, 10, 12, 14, 18, 24, 36];

  function walk(str, ctx) {
    let i = 0;
    while (i < str.length) {
      if (str[i] !== '<') {
        const end = str.indexOf('<', i);
        const raw = end === -1 ? str.slice(i) : str.slice(i, end);
        const text = decode(raw);
        if (text) segments.push({ type: 'text', text, ...ctx });
        if (end === -1) break;
        i = end;
        continue;
      }

      const tagEnd = str.indexOf('>', i);
      if (tagEnd === -1) break;
      const rawTag = str.slice(i + 1, tagEnd).trim();

      // Closing tag — return so parent knows where inner content ended
      if (rawTag.startsWith('/')) { i = tagEnd + 1; continue; }

      // self-closing br
      const tagName = rawTag.split(/[\s/]/)[0].toLowerCase();
      if (tagName === 'br') {
        segments.push({ type: 'newline' });
        i = tagEnd + 1;
        continue;
      }

      // Find matching close tag (simplistic but sufficient for generated HTML)
      const closeTag = `</${tagName}>`;
      const closeIdx = str.indexOf(closeTag, tagEnd + 1);
      const inner = closeIdx !== -1 ? str.slice(tagEnd + 1, closeIdx) : '';

      const newCtx = { ...ctx };

      if (tagName === 'b' || tagName === 'strong') {
        newCtx.bold = true;
      } else if (tagName === 'i' || tagName === 'em') {
        newCtx.italic = true;
      } else if (tagName === 'u') {
        newCtx.underline = true;
      } else if (tagName === 'font') {
        const m = rawTag.match(/size="?(\d)"?/i);
        if (m) newCtx.size = htmlSizeToPt[Math.min(+m[1] - 1, 6)] || 12;
      } else if (tagName === 'h1') {
        newCtx.bold = true; newCtx.size = 22;
      } else if (tagName === 'h2') {
        newCtx.bold = true; newCtx.size = 18;
      } else if (tagName === 'h3') {
        newCtx.bold = true; newCtx.size = 14;
      } else if (tagName === 'span') {
        // Handle inline style font-size (px → pt approx)
        const m = rawTag.match(/font-size:\s*(\d+(?:\.\d+)?)(?:px|pt)/i);
        if (m) newCtx.size = Math.round(+m[1] * 0.75);
      }

      // Block elements: insert newline before (if not at start)
      const isBlock = ['p', 'div', 'h1', 'h2', 'h3'].includes(tagName);
      if (isBlock && segments.length > 0 && segments[segments.length - 1].type !== 'newline') {
        segments.push({ type: 'newline' });
      }

      walk(inner, newCtx);

      if (isBlock) segments.push({ type: 'newline' });

      i = closeIdx !== -1 ? closeIdx + closeTag.length : tagEnd + 1;
    }
  }

  // Strip leading/trailing newlines
  const normalized = html.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  walk(normalized, { bold: false, italic: false, underline: false, size: 11 });

  // Collapse consecutive newlines to a single one
  return segments.filter((s, idx, arr) =>
    !(s.type === 'newline' && arr[idx - 1]?.type === 'newline' && idx > 0)
  );
}

// ── Render segments to pdfkit ──────────────────────────────────────
function renderToPdf(doc, segments, defaultSize = 11) {
  const font = (bold, italic) => {
    if (bold && italic) return 'Helvetica-BoldOblique';
    if (bold) return 'Helvetica-Bold';
    if (italic) return 'Helvetica-Oblique';
    return 'Helvetica';
  };

  // Collect runs per line, flush on newline
  let lineRuns = [];

  const flushLine = () => {
    if (!lineRuns.length) return;
    for (let j = 0; j < lineRuns.length; j++) {
      const run = lineRuns[j];
      const isLast = j === lineRuns.length - 1;
      doc.font(font(run.bold, run.italic))
         .fontSize(run.size || defaultSize)
         .fillColor('#1a1a1a')
         .text(run.text, { continued: !isLast, lineGap: 2 });
    }
    lineRuns = [];
  };

  for (const seg of segments) {
    if (seg.type === 'newline') {
      if (lineRuns.length) {
        flushLine();
      } else {
        doc.moveDown(0.35);
      }
    } else if (seg.type === 'text') {
      lineRuns.push(seg);
    }
  }
  flushLine();
}

// ── Convert segments to docx TextRun/Paragraph objects ─────────────
function segmentsToDocxParagraphs(segments, { Paragraph, TextRun }) {
  const paragraphs = [];
  let currentRuns = [];

  const flush = () => {
    paragraphs.push(new Paragraph({ children: currentRuns, spacing: { after: 120 } }));
    currentRuns = [];
  };

  for (const seg of segments) {
    if (seg.type === 'newline') {
      flush();
    } else if (seg.type === 'text') {
      currentRuns.push(new TextRun({
        text: seg.text,
        bold: seg.bold || false,
        italics: seg.italic || false,
        underline: seg.underline ? {} : undefined,
        size: (seg.size || 11) * 2,   // half-points
        font: 'Calibri',
      }));
    }
  }
  if (currentRuns.length) flush();

  return paragraphs;
}

// All template routes require authentication
router.use(authenticate);

// ==================== LIST TEMPLATES ====================
// GET /api/templates
router.get('/', async (req, res) => {
  try {
    const templates = await DocumentTemplate.findAll({
      where: { organization_id: req.user.organization_id, is_active: true },
      include: [{ model: User, as: 'creator', attributes: ['id', 'first_name', 'last_name'] }],
      order: [['title', 'ASC']]
    });
    res.json({ success: true, data: templates });
  } catch (err) {
    console.error('Error listing templates:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve templates' });
  }
});

// ==================== GET SINGLE TEMPLATE ====================
// GET /api/templates/:id
router.get('/:id',
  param('id').isInt(), validateRequest,
  async (req, res) => {
    try {
      const template = await DocumentTemplate.findOne({
        where: { id: req.params.id, organization_id: req.user.organization_id }
      });
      if (!template) return res.status(404).json({ success: false, message: 'Template not found' });
      res.json({ success: true, data: template });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to retrieve template' });
    }
  }
);

// ==================== CREATE TEMPLATE ====================
// POST /api/templates  (admin + lawyer only)
router.post('/',
  authorize(['admin', 'lawyer']),
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('body').notEmpty().withMessage('Body is required'),
  body('category').optional().isIn([
    'contract', 'correspondence', 'court_document', 'legal_brief',
    'identification', 'financial', 'other'
  ]),
  validateRequest,
  async (req, res) => {
    try {
      const { title, description, body: templateBody, category } = req.body;
      const template = await DocumentTemplate.create({
        organization_id: req.user.organization_id,
        title,
        description: description || null,
        body: templateBody,
        category: category || 'other',
        created_by: req.user.id,
        is_active: true
      });
      res.status(201).json({ success: true, data: template });
    } catch (err) {
      console.error('Error creating template:', err);
      res.status(500).json({ success: false, message: 'Failed to create template' });
    }
  }
);

// ==================== UPDATE TEMPLATE ====================
// PUT /api/templates/:id  (admin + lawyer only)
router.put('/:id',
  authorize(['admin', 'lawyer']),
  param('id').isInt(),
  body('title').optional().trim().notEmpty(),
  body('category').optional().isIn([
    'contract', 'correspondence', 'court_document', 'legal_brief',
    'identification', 'financial', 'other'
  ]),
  validateRequest,
  async (req, res) => {
    try {
      const template = await DocumentTemplate.findOne({
        where: { id: req.params.id, organization_id: req.user.organization_id }
      });
      if (!template) return res.status(404).json({ success: false, message: 'Template not found' });

      const { title, description, body: templateBody, category } = req.body;
      const updates = {};
      if (title !== undefined) updates.title = title;
      if (description !== undefined) updates.description = description;
      if (templateBody !== undefined) updates.body = templateBody;
      if (category !== undefined) updates.category = category;

      await template.update(updates);
      res.json({ success: true, data: template });
    } catch (err) {
      console.error('Error updating template:', err);
      res.status(500).json({ success: false, message: 'Failed to update template' });
    }
  }
);

// ==================== DELETE TEMPLATE ====================
// DELETE /api/templates/:id  (admin + lawyer only)
router.delete('/:id',
  authorize(['admin', 'lawyer']),
  param('id').isInt(), validateRequest,
  async (req, res) => {
    try {
      const template = await DocumentTemplate.findOne({
        where: { id: req.params.id, organization_id: req.user.organization_id }
      });
      if (!template) return res.status(404).json({ success: false, message: 'Template not found' });
      // Soft delete
      await template.update({ is_active: false });
      res.json({ success: true, message: 'Template deleted' });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to delete template' });
    }
  }
);

// ==================== GENERATE DOCUMENT FROM TEMPLATE ====================
// POST /api/templates/:id/generate
// Body: { dossier_id, format }  — format: 'pdf' (default) | 'docx'
router.post('/:id/generate',
  param('id').isInt(),
  body('dossier_id').isInt().withMessage('dossier_id is required'),
  body('format').optional().isIn(['pdf', 'docx']),
  body('encrypt').optional().isBoolean(),
  body('create_timeline_entry').optional().isBoolean(),
  body('timeline_title').optional().trim(),
  body('is_billable').optional().isBoolean(),
  body('hours_worked').optional().isFloat({ min: 0 }),
  body('hourly_rate').optional().isFloat({ min: 0 }),
  validateRequest,
  async (req, res) => {
    try {
      const template = await DocumentTemplate.findOne({
        where: { id: req.params.id, organization_id: req.user.organization_id, is_active: true }
      });
      if (!template) return res.status(404).json({ success: false, message: 'Template not found' });

      const {
        dossier_id,
        format = 'pdf',
        encrypt = false,
        create_timeline_entry = false,
        timeline_title,
        is_billable = false,
        hours_worked = 0,
        hourly_rate = 0
      } = req.body;

      // Fetch dossier with client and assigned lawyer
      const dossier = await Dossier.findOne({
        where: { id: dossier_id, organization_id: req.user.organization_id },
        include: [
          { model: Client, as: 'client' },
          { model: User, as: 'assignedLawyer', attributes: ['first_name', 'last_name', 'email'] }
        ]
      });
      if (!dossier) return res.status(404).json({ success: false, message: 'Dossier not found' });

      const org = await Organization.findByPk(req.user.organization_id, {
        attributes: ['name', 'email', 'address', 'encryption_salt']
      });
      const client = dossier.client;
      const lawyer = dossier.assignedLawyer;
      const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

      // Variable substitution
      const vars = {
        '{{client_name}}':            client ? `${client.first_name} ${client.last_name}` : '',
        '{{client_first_name}}':      client?.first_name || '',
        '{{client_last_name}}':       client?.last_name || '',
        '{{client_email}}':           client?.email || '',
        '{{client_phone}}':           client?.phone || '',
        '{{client_address}}':         client?.address || '',
        '{{client_personal_number}}': client?.personal_number || '',
        '{{dossier_number}}':         dossier.dossier_number || '',
        '{{dossier_title}}':          dossier.title || '',
        '{{lawyer_name}}':            lawyer ? `${lawyer.first_name} ${lawyer.last_name}` : '',
        '{{lawyer_email}}':           lawyer?.email || '',
        '{{date}}':                   today,
        '{{organization_name}}':      org?.name    || 'Your Company Name',
        '{{org_email}}':              org?.email   || 'your@company.com',
        '{{org_address}}':            org?.address || 'Your Company Address',
      };

      // Replace inside raw HTML (preserves tags)
      let generatedBody = template.body;
      for (const [placeholder, value] of Object.entries(vars)) {
        generatedBody = generatedBody.split(placeholder).join(value);
      }

      // Parse HTML to segments for PDF/DOCX rendering
      const segments = htmlToSegments(generatedBody);

      const uploadsDir = path.join(
        __dirname, '../../uploads/organizations',
        req.user.organization_id,
        'dossiers',
        String(dossier_id)
      );
      await fs.mkdir(uploadsDir, { recursive: true });
      const safeTitle = template.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const timestamp = Date.now();

      let fileBuffer, generatedFilename, mimeType, originalFilename;

      if (format === 'pdf') {
        // ── PDF via pdfkit — HTML-aware ─────────────────────────────
        const PDFDocument = require('pdfkit');

        fileBuffer = await new Promise((resolve, reject) => {
          const doc = new PDFDocument({
            size: 'A4',
            bufferPages: true,
            margins: { top: 72, bottom: 72, left: 72, right: 72 }
          });
          const chunks = [];
          doc.on('data', chunk => chunks.push(chunk));
          doc.on('end', () => resolve(Buffer.concat(chunks)));
          doc.on('error', reject);

          // Title
          doc.font('Helvetica-Bold').fontSize(18).fillColor('#1e3a5f').text(template.title, { align: 'left' });
          doc.moveDown(0.4);
          doc.moveTo(doc.page.margins.left, doc.y)
             .lineTo(doc.page.width - doc.page.margins.right, doc.y)
             .strokeColor('#cccccc').lineWidth(1).stroke();
          doc.moveDown(0.5);

          // Body with formatting
          renderToPdf(doc, segments);

          // Footers
          const range = doc.bufferedPageRange();
          for (let p = 0; p < range.count; p++) {
            doc.switchToPage(range.start + p);
            doc.font('Helvetica').fontSize(9).fillColor('#999999')
               .text(
                 `${org?.name || ''} — Generated ${today} — Page ${p + 1} of ${range.count}`,
                 doc.page.margins.left,
                 doc.page.height - doc.page.margins.bottom + 18,
                 { align: 'center', width: doc.page.width - doc.page.margins.left - doc.page.margins.right }
               );
          }

          doc.end();
        });

        generatedFilename = `generated_${safeTitle}_${timestamp}.pdf`;
        mimeType = 'application/pdf';
        originalFilename = `${template.title}.pdf`;

      } else {
        // ── DOCX via docx package — HTML-aware ─────────────────────
        const { Document: DocxDoc, Packer, Paragraph, TextRun,
                HeadingLevel, Header, Footer } = require('docx');

        const bodyParagraphs = segmentsToDocxParagraphs(segments, { Paragraph, TextRun });

        const docx = new DocxDoc({
          sections: [{
            properties: {},
            headers: {
              default: new Header({
                children: [new Paragraph({
                  children: [new TextRun({ text: org?.name || '', size: 18, color: '999999', font: 'Calibri' })]
                })]
              })
            },
            footers: {
              default: new Footer({
                children: [new Paragraph({
                  children: [new TextRun({ text: `Generated on ${today}`, size: 18, color: '999999', font: 'Calibri' })]
                })]
              })
            },
            children: [
              new Paragraph({
                text: template.title,
                heading: HeadingLevel.HEADING_1,
                spacing: { after: 240 }
              }),
              ...bodyParagraphs
            ]
          }]
        });

        fileBuffer = await Packer.toBuffer(docx);
        generatedFilename = `generated_${safeTitle}_${timestamp}.docx`;
        mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        originalFilename = `${template.title}.docx`;
      }

      // Optionally encrypt the buffer with the per-org AES-256 key
      let savedBuffer = fileBuffer;
      let savedFilename = generatedFilename;
      let encryptionType = 'none';

      if (encrypt) {
        if (org?.encryption_salt) {
          const orgKey = deriveOrgKey(org.encryption_salt);
          savedBuffer = encryptBuffer(fileBuffer, orgKey);
        } else {
          // Fall back to global key if org has no salt
          savedBuffer = encryptBuffer(fileBuffer);
        }
        savedFilename = generatedFilename + '.enc';
        encryptionType = 'aes256';
      }

      // Save file to disk
      const filePath = path.join(uploadsDir, savedFilename);
      await fs.writeFile(filePath, savedBuffer);

      // Create Document record
      const document = await Document.create({
        dossier_id: dossier_id,
        organization_id: req.user.organization_id,
        original_filename: originalFilename,
        filename: savedFilename,
        file_path: filePath,
        file_size: savedBuffer.length,
        mime_type: mimeType,   // stored original MIME — download/preview handler decrypts transparently
        is_confidential: encrypt ? true : false,
        category: template.category || 'other',
        description: `Generated from template: ${template.title}`,
        document_date: new Date(),
        uploaded_by: req.user.id,
        metadata: {
          generated_from_template: template.id,
          template_title: template.title,
          format,
          encryption: encryptionType,
          original_size: fileBuffer.length
        }
      });

      // Optionally create a timeline entry linked to this document
      if (create_timeline_entry) {
        const hours = parseFloat(hours_worked) || 0;
        const rate  = parseFloat(hourly_rate)  || 0;
        await TimelineNode.create({
          dossier_id,
          organization_id: req.user.organization_id,
          title: timeline_title || `Generated: ${template.title}`,
          description: `Document generated from template "${template.title}"`,
          activity_date: new Date(),
          node_type: 'document',
          document_id: document.id,
          is_billable,
          hours_worked: hours,
          hourly_rate:  rate,
          billing_amount: is_billable ? hours * rate : 0,
          created_by: req.user.id,
          status: 'completed'
        });
      }

      res.status(201).json({ success: true, data: document, message: 'Document generated successfully' });
    } catch (err) {
      console.error('Error generating document from template:', err);
      res.status(500).json({ success: false, message: 'Failed to generate document' });
    }
  }
);

module.exports = router;
