import {
  getGitDiff,
  parseCommits,
  generateMarkDown,
  loadChangelogConfig,
} from 'changelogen'

export async function generateChangelog (cwd: string, newVersion: string) {
  const config = await loadChangelogConfig(cwd, {
    newVersion,
  })

  const rawCommits = await getGitDiff(config.from, config.to)

  // Parse commits as conventional commits
  const commits = parseCommits(rawCommits, config).filter(
    (c) =>
      config.types[c.type] &&
      !(c.type === 'chore' && c.scope === 'deps' && !c.isBreaking)
  )

  // Generate markdown
  const markdown = await generateMarkDown(commits, config)

  return markdown
}
