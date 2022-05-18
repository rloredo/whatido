const URL_CAMPAIGN = /utm_campaign=([^&]*)/; //regex pattern to check in the tracking template
const NOTIFY = [];  // List of mails to notify (strings)
const ACCOUNT_IDS = []; // List of all account ids (strings)

function main() {
MccApp.accounts().withIds(ACCOUNT_IDS).executeInParallel('getNonMatchingCampaigns', 'reportResults');
}

function getNonMatchingCampaigns() {
const currentAccount = AdsApp.currentAccount()
const campaignIterator = AdsApp.campaigns().withCondition("campaign.status = ENABLED").get();
let nonMatchingCampaigns = [];
while (campaignIterator.hasNext()) {
  let campaign = campaignIterator.next();
  let trackingTemplate = campaign.urls().getTrackingTemplate();
  let campaignName = campaign.getName();
  let trackingTemplateCampaign = URL_CAMPAIGN.exec(trackingTemplate) 
  
  if(trackingTemplateCampaign !== null){ //If regex doesn't match, add it as missing utm parameter
    if(campaignName !== trackingTemplateCampaign[1]){
      nonMatchingCampaigns.push({"campaignName":campaignName, "currentTemplate":trackingTemplateCampaign[1]});
      }
    } else {nonMatchingCampaigns.push({"campaignName":campaignName, "currentTemplate": "no utm_medium parameter"})}}
  if(nonMatchingCampaigns.length > 0){
    return {"account":currentAccount.getName(), "nonMatchingCampaigns":nonMatchingCampaigns}
    }
};

function reportResults(responses) {
  var summaryData = [];
  for(var i in responses){
    if(responses[i].getReturnValue() !== null){
    summaryData.push(JSON.parse(responses[i].getReturnValue()));
    }
  } 
  
  if(summaryData.length > 0) {
   sendSummaryEmail(summaryData);
  } else {console.log('All clear!')}
  };

function sendSummaryEmail(summaryData) {
    var subject = 'Non Matching URLs Script - Results';
    var body = subject;
    var htmlBody = '<html><body><p>'+subject+'</p><dl>';
    for (let i = 0; i < summaryData.length; i++){
      htmlBody += '<dt>'+summaryData[i]['account']+': </dt>'
        for (let j = 0; j < summaryData[i]['nonMatchingCampaigns'].length; j++){
          htmlBody += '<dd>- Current utm_campaign: '
                      +summaryData[i][['nonMatchingCampaigns']][j]['currentTemplate']
                      +' // Correct utm_campaign: ' 
                      +summaryData[i][['nonMatchingCampaigns']][j]['campaignName']
                      +'</dd>'
          } 
    } 
    htmlBody += '</dl></body></html>';
    //console.log(htmlBody);
    var options = { htmlBody : htmlBody };
    for(var i in NOTIFY) {
      MailApp.sendEmail(NOTIFY[i], subject, body, options);
    }
  }