# Deployment Workflow

## Description

How to deploy changes to the DentalHire application after making updates.

## Steps

// turbo-all

1. Stage all changes:

```bash
git add .
```

2. Commit with a descriptive message:

```bash
git commit -m "your commit message here"
```

3. Push to the remote repository:

```bash
git push origin master
```

4. Vercel will automatically detect the push and deploy the changes.

## Notes

- If `git push` hangs, it may be waiting for authentication. The user should run the command manually in their terminal.
- Deployment typically takes 1-2 minutes after pushing.
