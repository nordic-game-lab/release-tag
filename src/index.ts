import * as core from '@actions/core'
import { GitHub, context } from '@actions/github'
import { command as execaCommand } from 'execa'

async function run() {
  try {
    // Get authenticated GitHub client (Ocktokit): https://github.com/actions/toolkit/tree/master/packages/github#usage
    const github = new GitHub(process.env.GITHUB_TOKEN)

    // Get owner and repo from context of payload that triggered the action
    const { owner, repo } = context.repo

    // Get the inputs from the workflow file: https://github.com/actions/toolkit/tree/master/packages/core#inputsoutputs
    const tagName = core.getInput('tag_name', { required: true })

    // This removes the 'refs/tags' portion of the string, i.e. from 'refs/tags/v1.10.15' to 'v1.10.15'
    const tag = tagName.replace('refs/tags/', '')
    const releaseName =
      core.getInput('release_name', { required: false }) || tag
    let bodyCommand = core.getInput('body_command', { required: false }) || null
    let body: string
    if (bodyCommand) {
      bodyCommand = bodyCommand.replace(/(yarn (run)?)/, '$1 --silent')
      const result = await execaCommand(bodyCommand, {
        stdio: 'pipe',
        shell: true,
      })
      body = result.stdout
      let lines = body.split('\n')
      // Cleanup output
      lines = lines.filter(line => !line.includes(tag))
      body = lines.join('\n').trim()
      console.log('Changelog body:')
      console.log(body)
    } else {
      body = ''
    }
    const draft = core.getInput('draft', { required: false }) === 'true'
    const prerelease = /\d-[a-z]/.test(tag)

    // Create a release
    // API Documentation: https://developer.github.com/v3/repos/releases/#create-a-release
    // Octokit Documentation: https://octokit.github.io/rest.js/#octokit-routes-repos-create-release
    await github.repos.createRelease({
      owner,
      repo,
      tag_name: tag,
      name: releaseName,
      body,
      draft,
      prerelease,
    })
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
