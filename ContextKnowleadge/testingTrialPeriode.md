1. Test the trial banner (frontend)

The banner reads trial_ends_at from the DB. Just set it to a near date directly:


# Connect to your DB and update the org's trial end date
psql -U imeri -d lexbox_db -p 5000 -c "
  UPDATE organizations 
  SET trial_ends_at = NOW() + INTERVAL '3 days'
  WHERE name = 'Besim Parduzi Avokat';
"
Log in as the org admin → you'll see the yellow 3-day warning banner immediately.


# Test 1-day urgent (red) banner
psql -U imeri -d lexbox_db -p 5000 -c "
  UPDATE organizations 
  SET trial_ends_at = NOW() + INTERVAL '1 day'
  WHERE name = 'Besim Parduzi Avokat';
"

# Test expired/suspended banner
psql -U imeri -d lexbox_db -p 5000 -c "
  UPDATE organizations 
  SET trial_ends_at = NOW() - INTERVAL '1 day',
      subscription_status = 'past_due',
      status = 'suspended'
  WHERE name = 'Besim Parduzi Avokat';
"
2. Test the scheduler emails without waiting

The scheduler exports runTrialCheck and runMonthlyBilling — call them directly via a script:


cd /Users/imeri/Desktop/Dev/LexBoxDev/backend-lexbox
node -e "
require('dotenv').config();
require('./src/models/index'); // load associations
const { runTrialCheck, runMonthlyBilling } = require('./src/services/trial.scheduler');
runTrialCheck().then(() => {
  console.log('Trial check done');
  return runMonthlyBilling();
}).then(() => {
  console.log('Monthly billing done');
  process.exit(0);
}).catch(e => { console.error(e); process.exit(1); });
"
Check your Mailtrap inbox — you should see the warning/expired email appear within seconds.

3. Test the upgrade request flow


# As org admin — POST the upgrade request
curl -X POST http://localhost:3001/api/org/upgrade-request \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <org_admin_token>" \
  -d '{"message": "We would like to upgrade to yearly billing"}'
Super admin email gets notified → they open Super Admin → Organizations → expand the org → click Activate Subscription.

4. Test monthly invoice email directly


# Set org to active first, then run billing
psql -U imeri -d lexbox_db -p 5000 -c "
  UPDATE organizations 
  SET subscription_status = 'active', status = 'active'
  WHERE name = 'Besim Parduzi Avokat';
"

# Then run the scheduler
node -e "
require('dotenv').config();
require('./src/models/index');
const { runMonthlyBilling } = require('./src/services/trial.scheduler');
runMonthlyBilling().then(() => process.exit(0));
"
5. Quick reset after testing


psql -U imeri -d lexbox_db -p 5000 -c "
  UPDATE organizations 
  SET trial_ends_at = NOW() + INTERVAL '14 days',
      subscription_status = 'trial',
      status = 'active'
  WHERE name = 'Besim Parduzi Avokat';
"
