# Portainer Git deployment

Portainer does not discover a Git branch from `docker-compose.yml`. The repository URL,
repository reference, credentials, and automatic-update policy belong to the Portainer stack
configuration. The Compose file only describes how to build and run the checked-out revision.

## Recommended stack settings

Create the stack using **Git repository** and configure:

| Portainer setting | Value |
| --- | --- |
| Repository URL | The clone URL for this repository, ending in `.git` when required by the provider |
| Repository reference | `refs/heads/main` |
| Compose path | `docker-compose.yml` |
| GitOps updates | Enabled |
| Update mechanism | Polling at the desired interval, or a repository webhook |

Use credentials with read access when the repository is private. A personal access token must
be valid, must be authorized for the organization when SSO is enforced, and must be stored in
Portainer rather than committed to this repository.

The fully qualified reference is deliberate: `refs/heads/main` identifies a branch, whereas a
short name can be ambiguous with a tag. Portainer can only offer or pull this reference after
`main` exists on the remote. A local branch, a pull-request branch, or a commit in this coding
workspace does not create the remote reference; merge or push the changes to remote `main` first.

## Git source versus Docker image

The public Git repository supplies the Docker build context; it does not publish a Docker image.
These are separate registries and separate access paths. The `codex` Compose service intentionally
has `build` but no `image`, so Portainer must build it from the checked-out repository and must not
try to pull `cataclysm-codex:latest` from Docker Hub.

If Portainer reports `pull access denied for cataclysm-codex`, update the stack from the current
`main` Compose file and disable **Re-pull image** for that redeployment. The named application
container remains `cataclysm-codex`; the locally built image name is managed by Compose from the
Portainer stack name and the `codex` service name. If a prebuilt image is desired later, publish it
to an actual registry first and then add its fully qualified name, such as
`ghcr.io/owner/cataclysm-codex:<version>`.

## Verify the reference outside Portainer

Run the project check with the same clone URL configured in Portainer:

```bash
npm run portainer:check-ref -- https://github.com/OWNER/REPOSITORY.git
```

For a private repository, run it in an environment that already has suitable Git credentials.
The command checks the exact `refs/heads/main` remote reference and confirms the Compose path
that should be entered in Portainer. To intentionally deploy another branch, set
`PORTAINER_GIT_BRANCH` for the check, but production should continue to use `main`.

## Why a stack can remain stale

1. The stack was created with **Web editor** or an uploaded file instead of **Git repository**.
2. The configured reference is a feature branch, tag, commit SHA, or nonexistent `main` branch.
3. GitOps updates are disabled, polling has not run, or the webhook is not reaching Portainer.
4. The repository is private and the saved token/key cannot read it.
5. The Compose path does not match the repository-root-relative `docker-compose.yml` path.
6. The new commit exists only in a pull request and has not been merged into remote `main`.
7. **Re-pull image** is enabled even though this stack builds the application locally.

After correcting the settings, use **Pull and redeploy** once. Then confirm the deployment's Git
commit matches the current remote `main` commit. Automatic polling or the webhook will handle
subsequent commits.
