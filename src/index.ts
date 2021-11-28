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
    const bodyCommand = core.getInput('body_command', { required: false }) || null
    let body: string
    if (bodyCommand) {
      const result = await execaCommand(bodyCommand, {
        stdio: 'pipe',
        shell: true,
      })
      body = result.stdout
      console.log(result)
      console.log('Changelog body:')
      console.log(result.stdout)
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
