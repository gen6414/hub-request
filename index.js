#!/usr/bin/env node

const axios = require('axios');
const ora = require('ora');
const fs = require('fs');

const GITHUB_API_BASE_URL = 'https://api.github.com'

// 引数のパスからJSONファイルを読み込む
const json = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));

(async () => {
  for (let repo of json.repos) {
    await pullRequest(json['access-token'], json['owner'], repo)
  }
})()

async function pullRequest(accessToken, owner, repo) {

  const spinner = ora(`Processing pull request ${owner}/${repo.name}`).start();

  const repoUrl = `${GITHUB_API_BASE_URL}/repos/${owner}/${repo.name}`

  const pullRequest = repo['pull-request']

  try {

    // プルリクエスト
    const res = await axios.post(`${repoUrl}/pulls`, {
      title: pullRequest.title,
      body : pullRequest.body,
      head : pullRequest.head,
      base : pullRequest.base
    },
    {
      headers: {
        Authorization: `token ${accessToken}`
      }
    })

    // reviewersの追加
    await axios.post(`${repoUrl}/pulls/${res.data.number}/requested_reviewers`, {
      reviewers: pullRequest.reviewers,
    },
    {
      headers: {
        Authorization: `token ${accessToken}`
      }
    })

    // assigneesの追加
    await axios.post(`${repoUrl}/issues/${res.data.number}/assignees`, {
      assignees: pullRequest.assignees,
    },
    {
      headers: {
        Authorization: `token ${accessToken}`
      }
    })

  } catch(err) {

    spinner.fail(`Failed pull request ${owner}/${repo.name}`)

    return

  }

  spinner.succeed(`Completed pull request ${owner}/${repo.name}`)

}
