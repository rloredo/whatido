const URL_CAMPAIGN = /utm_campaign=([^&]*)/; //Regex pattern to check. In this case, campaign name.
const NOTIFY = ['loredo.rod@g--il.com',]; //List of emails to notify

function main() {
  MccApp.accounts().withIds([YOUR_ACCOUNT_IDS]).executeInParallel('getNonMatchingCampaigns', 'reportResults');
}

function getNonMatchingCampaigns() {
  const currentAccount = AdsApp.currentAccount()
  const campaignIterator = AdsApp.campaigns().withCondition("campaign.status = ENABLED").get(); //Only enabled campaigns
  let nonMatchingCampaigns = [];
  while (campaignIterator.hasNext()) {
    let campaign = campaignIterator.next();
    let trackingTemplate = campaign.urls().getTrackingTemplate();
    let campaignName = campaign.getName();
    let trackingTemplateCampaign = URL_CAMPAIGN.exec(trackingTemplate)[1] 
    if (campaignName !== trackingTemplateCampaign){
        nonMatchingCampaigns.push(campaignName)
      };
    } 
    if(nonMatchingCampaigns.length > 0){
      return [currentAccount.getName(), nonMatchingCampaigns]
      }
};

//Collect the results from parallel execution
function reportResults(responses) {
  var summaryData = [];
  for(var i in responses){
    if(responses[i].getReturnValue() !== null){
      summaryData.push(JSON.parse(responses[i].getReturnValue()));
      }
    } 
  if(summaryData.length > 0) {
    sendSummaryEmail(summaryData);
    }
  };

// This will send an email with the campaigns with non matching urls
function sendSummaryEmail(summaryData) {
    var subject = 'Non Matching URLs Script - Results';
    var body = subject;
    var htmlBody = '<html><body><p>'+subject+'</p><dl>';
    for(let i = 0; i < summaryData.length; i++){
        htmlBody += '<dt>'+summaryData[i][0]+': </dt>'
        for(let j = 0; j < summaryData[i][1].length; j++){
            htmlBody += '<dd>- '+summaryData[i][1][j]+'</dd>'
          } 
        } 
    htmlBody += '</dl></body></html>';
    var options = { htmlBody : htmlBody };
    for(var i in NOTIFY) {
        MailApp.sendEmail(NOTIFY[i], subject, body, options);
       }
  }