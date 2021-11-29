import * as core from '@actions/core'
import { GitHub, context } from '@actions/github'
import changelog from 'conventional-changelog'
import changelogPresetAngular from 'conventional-changelog-angular'
import changelogPresetAtom from 'conventional-changelog-atom'
import changelogPresetCodemirror from 'conventional-changelog-codemirror'
import changelogPresetEmber from 'conventional-changelog-ember'
import changelogPresetEslint from 'conventional-changelog-eslint'
import changelogPresetExpress from 'conventional-changelog-express'
import changelogPresetJquery from 'conventional-changelog-jquery'
import changelogPresetJshint from 'conventional-changelog-jshint'
import { readStream } from './util'

const changelogPresets = {
  angular: changelogPresetAngular,
  atom: changelogPresetAtom,
  codemirror: changelogPresetCodemirror,
  ember: changelogPresetEmber,
  eslint: changelogPresetEslint,
  express: changelogPresetExpress,
  jquery: changelogPresetJquery,
  jshint: changelogPresetJshint,
}

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
    const preset = core.getInput('preset', { required: false }) ?? undefined
    const changelogResult = changelog({
      config: preset ? changelogPresets[preset] : undefined,
      releaseCount: 2,
    })
    let body = await readStream(changelogResult)
    let lines = body.split('\n')
    // Cleanup output
    const tagFilter = tag.replace('v', '')
    lines = lines.filter(line => !line.includes(tagFilter))
    body = lines.join('\n').trim()
    console.log('Changelog body:')
    console.log(body)
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
