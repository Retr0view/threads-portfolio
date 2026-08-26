const assert = require("assert");
const { execFileSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const outputPath = path.join(__dirname, "..", "lib", "last-commit-date.json");

function normalizeDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`Invalid content date "${value}". Expected YYYY-MM-DD.`);
  }

  const parsedDate = new Date(`${value}T00:00:00.000Z`);
  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== value
  ) {
    throw new Error(
      `Invalid content date "${value}". Expected a real calendar date.`
    );
  }

  return value;
}

function getGitCommitDate(cwd) {
  let commitDate;

  try {
    commitDate = execFileSync("git", ["log", "-1", "--format=%aI"], {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch {
    throw new Error(
      "Unable to read a Git commit date. Run this command in a Git checkout or pass --date YYYY-MM-DD."
    );
  }

  if (!commitDate) {
    throw new Error(
      "The Git checkout has no commits. Pass the intended content revision with --date YYYY-MM-DD."
    );
  }

  const parsedDate = new Date(commitDate);
  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error(`Git returned an invalid commit date: "${commitDate}".`);
  }

  return parsedDate.toISOString().slice(0, 10);
}

function serializeDate(date) {
  return `${JSON.stringify({ date }, null, 2)}\n`;
}

function writeDateIfChanged(targetPath, date) {
  const nextContent = serializeDate(date);
  const currentContent = fs.existsSync(targetPath)
    ? fs.readFileSync(targetPath, "utf8")
    : null;

  if (currentContent === nextContent) {
    return false;
  }

  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, nextContent);
  return true;
}

function parseArguments(arguments_) {
  const options = { date: null, selfTest: false };

  for (let index = 0; index < arguments_.length; index += 1) {
    const argument = arguments_[index];

    if (argument === "--self-test") {
      options.selfTest = true;
      continue;
    }

    if (argument === "--date") {
      const date = arguments_[index + 1];
      if (!date) {
        throw new Error("--date requires a YYYY-MM-DD value.");
      }
      options.date = normalizeDate(date);
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${argument}`);
  }

  if (options.selfTest && options.date) {
    throw new Error("--self-test and --date cannot be used together.");
  }

  return options;
}

function runSelfTest() {
  const fixtureRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), "portfolio-content-date-")
  );

  try {
    const repositoryPath = path.join(fixtureRoot, "repository");
    fs.mkdirSync(repositoryPath);
    execFileSync("git", ["init", "--quiet"], { cwd: repositoryPath });
    execFileSync("git", ["config", "user.name", "Fixture"], {
      cwd: repositoryPath,
    });
    execFileSync("git", ["config", "user.email", "fixture@example.test"], {
      cwd: repositoryPath,
    });
    fs.writeFileSync(path.join(repositoryPath, "content.txt"), "fixture\n");
    execFileSync("git", ["add", "content.txt"], { cwd: repositoryPath });
    execFileSync(
      "git",
      ["-c", "commit.gpgsign=false", "commit", "--quiet", "-m", "Fixture"],
      {
        cwd: repositoryPath,
        env: {
          ...process.env,
          GIT_AUTHOR_DATE: "2024-02-29T12:00:00Z",
          GIT_COMMITTER_DATE: "2024-02-29T12:00:00Z",
        },
      }
    );
    assert.equal(getGitCommitDate(repositoryPath), "2024-02-29");

    const noGitPath = path.join(fixtureRoot, "no-git");
    fs.mkdirSync(noGitPath);
    assert.throws(
      () => getGitCommitDate(noGitPath),
      /Unable to read a Git commit date/
    );

    const unchangedPath = path.join(fixtureRoot, "unchanged.json");
    fs.writeFileSync(unchangedPath, serializeDate("2024-02-29"));
    const fixedTime = new Date("2000-01-01T00:00:00.000Z");
    fs.utimesSync(unchangedPath, fixedTime, fixedTime);
    const beforeModifiedTime = fs.statSync(unchangedPath).mtimeMs;
    assert.equal(writeDateIfChanged(unchangedPath, "2024-02-29"), false);
    assert.equal(fs.statSync(unchangedPath).mtimeMs, beforeModifiedTime);

    assert.throws(() => normalizeDate("2024-02-30"), /real calendar date/);
    assert.throws(() => normalizeDate("29-02-2024"), /Expected YYYY-MM-DD/);
  } finally {
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
  }

  console.log("Content-date fixtures passed.");
}

function main() {
  const options = parseArguments(process.argv.slice(2));

  if (options.selfTest) {
    runSelfTest();
    return;
  }

  const contentDate =
    options.date ?? getGitCommitDate(path.join(__dirname, ".."));
  const changed = writeDateIfChanged(outputPath, contentDate);
  console.log(
    `${changed ? "Updated" : "Unchanged"} content revision: ${contentDate}`
  );
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
