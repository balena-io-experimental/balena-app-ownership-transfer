var Balena = require('balena-sdk');
var _ = require('lodash');

const sourceToken = process.env.SOURCE_TOKEN;
const targetToken = process.env.TARGET_TOKEN;
const dryRun = process.env.DRY_RUN;

var sourceId;
var targetId;

var balenaSource = Balena({
  apiUrl: "https://api.balena-cloud.com",
  dataDirectory: "/tmp/balena-source"
});

var balenaTarget = Balena({
  apiUrl: "https://api.balena-cloud.com",
  dataDirectory: "/tmp/balena-target"
});

async function login() {
  await balenaSource.auth.loginWithToken(sourceToken)
  console.log('Source logged in');
  await balenaTarget.auth.loginWithToken(targetToken);
  console.log('Target logged in');

  sourceId = await balenaSource.auth.getUserId();
  targetId = await balenaTarget.auth.getUserId();
}

async function getSourceApps() {
  return balenaSource.models.application.getAll({ $filter: { user: sourceId } });//{ $filter: { organization: sourceOrg.id } });
}

async function addMemberToApp(sdk, userId, appId) {
  return sdk.pine.post({
    resource: 'user__is_member_of__application',
    body: {
      user: userId,
      is_member_of__application: appId
    }
  })
}

login()
.then(() => {
  return getSourceApps();
})
.then((sourceApps) => {
  console.log(sourceApps);
  console.log("Will transfer apps:", _.map(sourceApps, 'app_name'));
  console.log('From user ', sourceId, ' to user ', targetId);
  if (dryRun == "true") {
    console.log('Skipping due to dry run');
    return
  }
  return Promise.all(_.map(sourceApps, (sourceApp) => {
    return balenaTarget.models.application.create({
      name: sourceApp.app_name,
      deviceType: 'raspberrypi3'
    }).then((targetApp) => {
      // Add source as member on target app
      return addMemberToApp(balenaTarget, sourceId, targetApp.id)
    }).then(() => {
      // Transfer ownership
      return balenaSource.pine.patch({
        resource: 'application',
        id: sourceApp.id,
        body: {
          user: targetId
        }
      });
    }).then(() => {
      // re-add source as developer
      return addMemberToApp(balenaTarget, sourceId, sourceApp.id)
    })
  .catch((err) => {
      console.log('Error transferring ', sourceApp.app_name, ': ', err, err.stack);
    });
  }));
});
