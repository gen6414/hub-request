#!/usr/bin/env node

const axios = require('axios');
const ora = require('ora');
const fs = require('fs');

const GITHUB_API_BASE_URL = 'https://api.github.com'

// 引数のパスからJSONファイルを読み込む
const json = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));

for (let repo of json.repos) {

  pullRequest(json['access-token'], json['owner'], repo)

}

async function pullRequest(accessToken, owner, repo) {

  const spinner = ora(`Processing pull request owner/${repo.name}`).start();

  try {

    // プルリクエスト
    const res = await axios.post(`${GITHUB_API_BASE_URL}/repos/${owner}/${repo.name}/pulls`, {
      title: repo['pull-request'].title,
      body : repo['pull-request'].body,
      head : repo['pull-request'].head,
      base : repo['pull-request'].base
    },
    {
      headers: {
        Authorization: `token ${accessToken}`
      }
    })

    // reviewersの追加
    await axios.post(`${GITHUB_API_BASE_URL}/repos/${owner}/${repo.name}/pulls/${res.data.number}/requested_reviewers`, {
      reviewers: repo['pull-request'].reviewers,
    },
    {
      headers: {
        Authorization: `token ${accessToken}`
      }
    })

    // assigneesの追加
    await axios.post(`${GITHUB_API_BASE_URL}/repos/${owner}/${repo.name}/issues/${res.data.number}/assignees`, {
      assignees: repo['pull-request'].assignees,
    },
    {
      headers: {
        Authorization: `token ${accessToken}`
      }
    })

  } catch(err) {

    spinner.fail(`Failed pull request ${owner}/${repo.name}`)

    console.error(err)

    return

  }

  spinner.succeed(`Completed pull request ${owner}/${repo.name}`)

}
