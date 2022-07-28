import * as core from "@actions/core";
import * as github from "@actions/github";

let octokit;

async function run(){
  const githubToken = core.getInput('GITHUB_TOKEN');
  octokit = github.getOctokit(githubToken)
  
  checkTitle().then(result => {
    if(result){
      removeLabel();
    }else{
      addLabel();
    }
  })
}

async function checkTitle(){
  const title = github.context.payload.pull_request.title;
  const labels = github.context.payload.pull_request.labels;


  // skip checking for several label
  const skipLabels = core.getInput('SKIP_LABEL_NAME');
  const skipLabelsArray = skipLabels.split(",");
  for (let i = 0; i < labels.length; i++) {
    for (let j = 0; j < skipLabelsArray.length; j++) {
      if (labels[i].name == skipLabelsArray[j]){
        removeLabel();
        return true;
      }
    }
  }

  
  const allowedJiraTickets = core.getInput('ALLOWED_JIRA_TICKET');
  const allowedJiraTicketArray = allowedJiraTickets.split(',');
  let regexpPRTitle = new RegExp(".*\\b("+allowedJiraTicketArray.join('|')+")\\b.\\d{0,}[0-9]", 'i');

  if (regexpPRTitle.test(title)) {
    return true;
  }

  core.error(`PR title does not match allowed JIRA tickets`);
  return false;
}

async function addLabel(){
  const label_name = core.getInput('LABEL_NAME_FAILED');
  const label_color = core.getInput('LABEL_COLOR_FAILED');

  const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
  const issue_number = github.context.issue.number;

  try {
    core.info(`Initialize label (${label_name})...`);

    await octokit.rest.issues.createLabel({
      owner: owner,
      repo: repo,
      name: label_name,
      color: label_color,
    });

    core.info(`Finish initialize label (${label_name})`);
  } catch (error) {
    core.info(`Label (${label_name}) already created`);
  }


  core.info(`Adding label (${label_name}) to PR...`);
  
  let addLabelResponse = await octokit.rest.issues.addLabels({
    owner,
    repo,
    issue_number,
    labels: [label_name],
  });

  core.info(`Added label (${label_name}) to PR - ${addLabelResponse.status}`);
}

async function removeLabel(){
  const label_name = core.getInput('LABEL_NAME_FAILED');

  const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
  const issue_number = github.context.issue.number;

  try {
    core.info(`Removing label (${label_name}) from PR...`);
    
    await octokit.rest.issues.removeLabel({
      owner,
      repo,
      issue_number,
      name: label_name,
    });
  
    core.info(`Removed label (${label_name}) from PR `);
  } catch (error) {
    core.error(`Failed to remove label (${label_name}) from PR`);
  }
}

run();