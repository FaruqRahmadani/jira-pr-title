import * as core from "@actions/core";
import * as github from "@actions/github";

async function run(){
  const githubToken = core.getInput('GITHUB_TOKEN');
  const octokit = github.getOctokit(githubToken)
  
  checkTitle().then(result => {
    if(result){
      removeLabel(octokit);
    }else{
      addLabel(octokit);
    }
  })
}

async function checkTitle(){
  const title = github.context.payload.pull_request.title;
  
  const allowedJiraTickets = core.getInput('ALLOWED_JIRA_TICKET');
  const allowedJiraTicketArray = allowedJiraTickets.split(',');
  let regexpPRTitle = new RegExp(".*\\b("+allowedJiraTicketArray.join('|')+")\\b.\\d{0,}[0-9]", 'i');

  if (regexpPRTitle.test(title)) {
    return true;
  }
  return false;
}

async function addLabel(octokit){
  const label_name = core.getInput('LABEL_NAME_FAILED');
  const label_color = core.getInput('LABEL_COLOR_FAILED');

  const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
  const issue_number = github.context.issue.number;

  try {
    core.info(`Initialize label (${label_name})...`);

    addLabelResponse = await octokit.rest.issues.createLabel({
      owner,
      repo,
      label_name,
      color: label_color,
    });

    core.info(`Finish initialize label (${label_name})`);
  } catch (error) {
    core.info(`Label (${label_name}) already created`);
  }


  core.info(`Adding label (${label_name}) to PR...`);
  
  addLabelResponse = await octokit.rest.issues.addLabels({
    owner,
    repo,
    issue_number,
    labels: [label_name],
  });

  core.info(`Added label (${label_name}) to PR - ${addLabelResponse.status}`);
}

async function removeLabel(octokit){
  const label_name = core.getInput('LABEL_NAME_FAILED');

  const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
  const issue_number = github.context.issue.number;

  core.info(`Removing label (${label_name}) to PR...`);
  
  await octokit.rest.issues.addLabels({
    owner,
    repo,
    issue_number,
    labels: [label_name],
  });

  core.info(`Removed label (${label_name}) to PR - ${addLabelResponse.status}`);
}

run();