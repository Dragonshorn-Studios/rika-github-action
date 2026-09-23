/**
 * rika action — fetches the rikacli an instance serves at GET /cli and runs
 * one command against it. Builtins only: this file is the whole action, no
 * build step. Edit it directly and commit.
 */

const { spawnSync } = require('node:child_process');
const { appendFileSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');

function fail(message) {
    process.stderr.write(`::error::${message}\n`);
    process.exit(1);
}

function getInput(name) {
    const value = (process.env[`INPUT_${name.toUpperCase()}`] ?? '').trim();
    return value === '' ? undefined : value;
}

// Splits on whitespace, honoring single/double quotes — enough for rikacli's
// flag-style arguments (values never legitimately contain spaces).
function tokenize(command) {
    const args = [];
    const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
    let match;
    while ((match = re.exec(command)) !== null) {
        args.push(match[1] ?? match[2] ?? match[3]);
    }
    return args;
}

async function main() {
    const rikaUrl = (getInput('rika_url') || process.env.RIKA_URL || 'https://versionwithrika.cloud').replace(/\/+$/, '');
    const token = getInput('token') || process.env.RIKA_TOKEN;
    const team = getInput('team') || process.env.RIKA_TEAM;
    const project = getInput('project') || process.env.RIKA_PROJECT;
    const command = getInput('command');

    if (!token) {
        fail('token input (or RIKA_TOKEN env) is required');
    }
    if (!command) {
        fail('command input is required, e.g. "pin --bump=patch"');
    }

    process.stdout.write(`::add-mask::${token}\n`);

    // The instance serves a rikacli matched to its own API version.
    const response = await fetch(`${rikaUrl}/cli`);
    if (!response.ok) {
        fail(`GET ${rikaUrl}/cli returned ${response.status} ${response.statusText}`);
    }

    const cliPath = join(process.env.RUNNER_TEMP || tmpdir(), `rikacli-${process.pid}.mjs`);
    writeFileSync(cliPath, await response.text());

    const env = { ...process.env, RIKA_URL: rikaUrl, RIKA_TOKEN: token };
    if (team) env.RIKA_TEAM = team;
    if (project) env.RIKA_PROJECT = project;

    // Run under the same node that executes this action — always present.
    const result = spawnSync(process.execPath, [cliPath, ...tokenize(command)], {
        env,
        encoding: 'utf8',
    });
    if (result.error) {
        fail(`failed to run rikacli: ${result.error.message}`);
    }

    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);

    if (process.env.GITHUB_OUTPUT) {
        appendFileSync(
            process.env.GITHUB_OUTPUT,
            `stdout<<RIKA_STDOUT_EOF\n${result.stdout ?? ''}\nRIKA_STDOUT_EOF\n`,
        );
    }

    process.exitCode = result.status ?? 1;
}

main().catch((error) => fail(error.message));
