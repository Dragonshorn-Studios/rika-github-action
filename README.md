# rika GitHub Action

Runs a [`rikacli`](https://github.com/Dragonshorn-Studios/rika) command in a
workflow. The action downloads the rikacli your Rika instance serves at
`GET /cli`, so the CLI always matches the API it talks to — nothing is
vendored here.

## Usage

```yaml
- uses: Dragonshorn-Studios/rika-github-action@v1
  with:
    token: ${{ secrets.RIKA_TOKEN }}
    team: acme
    project: web
    command: pin --bump=patch
```

Each `uses:` runs one command; add more steps for more commands:

```yaml
- uses: Dragonshorn-Studios/rika-github-action@v1
  with:
    token: ${{ secrets.RIKA_TOKEN }}
    team: acme
    project: web
    command: commit

- uses: Dragonshorn-Studios/rika-github-action@v1
  with:
    token: ${{ secrets.RIKA_TOKEN }}
    team: acme
    project: web
    command: deploy production
```

## Inputs

| Input       | Required | Default              | Description                                      |
| ----------- | -------- | -------------------- | ------------------------------------------------ |
| `token`     | yes      | —                    | Rika API token (use a secret).                   |
| `command`   | yes      | —                    | rikacli command + args, e.g. `pin --bump=patch`. |
| `rika_url`  | no       | `https://versionwithrika.cloud` | Base URL of your (self-hosted) Rika instance. |
| `team`      | no       | —                    | Team slug. Not needed for `export`.              |
| `project`   | no       | —                    | Project slug. Not needed for `export`.           |

Every input falls back to the matching `RIKA_*` environment variable if set
(`RIKA_URL`, `RIKA_TOKEN`, `RIKA_TEAM`, `RIKA_PROJECT`).

## Outputs

| Output   | Description                             |
| -------- | --------------------------------------- |
| `stdout` | Captured stdout of the rikacli command. |

## Releasing

Tag releases so consumers can pin a major version:

```bash
git tag v1.0.0
git push origin v1.0.0
git tag -f v1   # move the major tag to the latest patch
git push -f origin v1
```
