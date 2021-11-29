# release-tag

This is a fork of [actions/create-release](https://github.com/actions/create-release) with a single change: automatically determine whether a tag is a pre-release by checking for presence of `-` followed by a letter in the tag name.

Example:

```yaml
name: Create release

on:
  push:
    tags:
      - "v*" # Push events to matching v*, i.e. v1.0, v20.15.10

jobs:
  build:
    name: Create Release
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@master
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      
      - name: Get yarn cache directory path
        id: yarn-cache-dir-path
        run: echo "::set-output name=dir::$(yarn cache dir)"
      
      - name: Yarn cache
        uses: actions/cache@v2
        id: yarn-cache
        with:
          path: ${{ steps.yarn-cache-dir-path.outputs.dir }}
          key: ${{ runner.os }}-yarn-${{ hashFiles('**/yarn.lock') }}-v1
          restore-keys: |
            ${{ runner.os }}-yarn-
      
      - name: Dependencies cache
        uses: actions/cache@v2
        with:
          path: '**/node_modules'
          key: ${{ runner.os }}-deps-${{ hashFiles('**/yarn.lock') }}-v1
      
      - name: Install
        run: yarn --frozen-lockfile --prefer-offline 

      - name: Create Release for Tag
        id: release_tag
        uses: Akryum/release-tag@master
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref }}
          body_command: yarn conventional-changelog -p angular -r 2
```
