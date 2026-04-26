const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendar.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/events',       calendarController.getEvents);
router.get('/upcoming',     calendarController.getUpcoming);
router.post('/events',      calendarController.createEvent);
router.put('/events/:id',   calendarController.updateEvent);
router.delete('/events/:id', calendarController.deleteEvent);

module.exports = router;
