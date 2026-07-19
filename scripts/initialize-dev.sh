#!/usr/bin/env bash
set -euo pipefail

log() {
  printf '[initialize-dev] %s\n' "$1"
}

fail_missing_command() {
  printf '[initialize-dev] error: required command not found: %s\n' "$1" >&2
  printf '[initialize-dev] install it in the development image or make curl/tar and a user-writable home directory available.\n' >&2
  exit 1
}

install_node_user_local() {
  local node_version="${NODE_VERSION:-24.18.0}"
  local node_arch archive_url install_root temp_dir

  command -v curl >/dev/null 2>&1 || fail_missing_command curl
  command -v tar >/dev/null 2>&1 || fail_missing_command tar

  case "$(uname -m)" in
    x86_64) node_arch='x64' ;;
    aarch64|arm64) node_arch='arm64' ;;
    *)
      printf '[initialize-dev] error: unsupported CPU architecture for Node.js: %s\n' "$(uname -m)" >&2
      exit 1
      ;;
  esac

  install_root="${XDG_DATA_HOME:-$HOME/.local/share}/initialize-dev/node-v${node_version}-linux-${node_arch}"
  if [[ ! -x "$install_root/bin/node" ]]; then
    temp_dir="$(mktemp -d)"
    trap 'rm -rf "$temp_dir"' RETURN
    archive_url="https://nodejs.org/dist/v${node_version}/node-v${node_version}-linux-${node_arch}.tar.xz"
    log "installing Node.js ${node_version} under ${install_root}"
    mkdir -p "$(dirname -- "$install_root")"
    curl --fail --silent --show-error --location "$archive_url" -o "$temp_dir/node.tar.xz"
    mkdir -p "$install_root"
    tar -xJf "$temp_dir/node.tar.xz" --strip-components=1 -C "$install_root"
    trap - RETURN
    rm -rf "$temp_dir"
  fi
  mkdir -p "$HOME/.local/bin"
  for executable in node npm npx corepack; do
    if [[ -x "$install_root/bin/$executable" ]]; then
      ln -sf "$install_root/bin/$executable" "$HOME/.local/bin/$executable"
    fi
  done
  export PATH="$install_root/bin:$PATH"
}

install_dotnet_user_local() {
  local dotnet_root="${DOTNET_ROOT:-$HOME/.dotnet}"

  command -v curl >/dev/null 2>&1 || fail_missing_command curl
  if [[ ! -x "$dotnet_root/dotnet" ]]; then
    log "installing .NET SDK from global.json under ${dotnet_root}"
    mkdir -p "$dotnet_root"
    curl --fail --silent --show-error --location https://dot.net/v1/dotnet-install.sh | bash /dev/stdin \
      --jsonfile global.json \
      --install-dir "$dotnet_root" \
      --no-path
  fi
  mkdir -p "$HOME/.local/bin"
  ln -sf "$dotnet_root/dotnet" "$HOME/.local/bin/dotnet"
  export DOTNET_ROOT="$dotnet_root"
  export PATH="$dotnet_root:$PATH"
}

install_user_path() {
  local path_file="$HOME/.config/myriale/dev-path.sh"
  local profile_file
  local profile_files=("$HOME/.profile" "$HOME/.bashrc")

  mkdir -p "$(dirname -- "$path_file")" "$HOME/.local/bin"
  cat > "$path_file" <<'EOF'
# Added by Myriale .mux/init. Keep user-local development tools on PATH.
export DOTNET_ROOT="${DOTNET_ROOT:-$HOME/.dotnet}"
export PATH="$HOME/.local/bin:$DOTNET_ROOT:$HOME/.dotnet/tools:$PATH"
EOF

  for profile_file in "${profile_files[@]}"; do
    touch "$profile_file"
    if ! grep -Fq 'myriale/dev-path.sh' "$profile_file"; then
      cat >> "$profile_file" <<'EOF'

# Myriale development tools
if [ -f "$HOME/.config/myriale/dev-path.sh" ]; then
  . "$HOME/.config/myriale/dev-path.sh"
fi
EOF
    fi
  done

  # Make the paths available to the current initialization process as well.
  # A parent shell cannot inherit exports from this script, so new shells use
  # the profile entries above.
  export DOTNET_ROOT="${DOTNET_ROOT:-$HOME/.dotnet}"
  export PATH="$HOME/.local/bin:$DOTNET_ROOT:$HOME/.dotnet/tools:$PATH"
}

install_global_cli_tools() {
  local npm_prefix="${NPM_CONFIG_PREFIX:-$HOME/.local}"

  command -v npm >/dev/null 2>&1 || fail_missing_command npm
  command -v dotnet >/dev/null 2>&1 || fail_missing_command dotnet
  mkdir -p "$npm_prefix/bin"
  export PATH="$npm_prefix/bin:$HOME/.dotnet/tools:$PATH"

  if ! command -v aspire >/dev/null 2>&1; then
    log 'installing Aspire CLI as a .NET global tool'
    if ! dotnet tool update --global Aspire.Cli --prerelease; then
      dotnet tool install --global Aspire.Cli --prerelease
    fi
  else
    log "Aspire CLI already available: $(aspire --version 2>/dev/null || printf 'unknown version')"
  fi

  if [[ -x "$HOME/.dotnet/tools/aspire" ]]; then
    ln -sf "$HOME/.dotnet/tools/aspire" "$npm_prefix/bin/aspire"
  fi

  if ! command -v agent-browser >/dev/null 2>&1; then
    log "installing agent-browser under ${npm_prefix}"
    npm install --global --prefix "$npm_prefix" agent-browser@latest
  else
    log 'agent-browser already available'
  fi

  command -v agent-browser >/dev/null 2>&1 || fail_missing_command agent-browser
  log 'installing agent-browser browser runtime'
  if [[ "$(id -u)" == '0' ]] || (command -v sudo >/dev/null 2>&1 && sudo -n true 2>/dev/null); then
    DEBIAN_FRONTEND=noninteractive agent-browser install --with-deps
  else
    agent-browser install
    log 'browser system libraries were not installed; run agent-browser install --with-deps with administrator access if launch fails'
  fi
}

script_dir="$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

command -v git >/dev/null 2>&1 || fail_missing_command git
if ! repo_root="$(git -C "$script_dir" rev-parse --show-toplevel 2>/dev/null)"; then
  printf '[initialize-dev] error: could not locate the Git repository root from %s\n' "$script_dir" >&2
  exit 1
fi

cd "$repo_root"
log "repository root: $repo_root"

install_user_path

if [[ -f package-lock.json ]]; then
  if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
    install_node_user_local
  fi
  command -v node >/dev/null 2>&1 || fail_missing_command node
  command -v npm >/dev/null 2>&1 || fail_missing_command npm
  log 'installing frontend dependencies with npm ci'
  npm ci
elif [[ -f package.json ]]; then
  if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
    install_node_user_local
  fi
  command -v node >/dev/null 2>&1 || fail_missing_command node
  command -v npm >/dev/null 2>&1 || fail_missing_command npm
  log 'installing frontend dependencies with npm install'
  npm install
else
  log 'no package.json found; skipping frontend dependency installation'
fi

if [[ -f global.json ]] && ! command -v dotnet >/dev/null 2>&1; then
  install_dotnet_user_local
fi

install_global_cli_tools

if [[ -f package.json ]] && grep -q '"@playwright/test"' package.json; then
  command -v npx >/dev/null 2>&1 || fail_missing_command npx
  log 'installing the Playwright Chromium browser'
  npx --no-install playwright install chromium
fi

if [[ -f backend/Myriale.slnx ]]; then
  if ! command -v dotnet >/dev/null 2>&1; then
    install_dotnet_user_local
  fi
  command -v dotnet >/dev/null 2>&1 || fail_missing_command dotnet
  log 'restoring backend dependencies with dotnet restore'
  dotnet restore backend/Myriale.slnx
else
  log 'no backend solution found; skipping .NET dependency restore'
fi

log 'development environment initialization complete'
