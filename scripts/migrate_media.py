#!/usr/bin/env python3
"""
Migrate WordPress media files to Strapi server.

Transfers all files from WordPress wp-content/uploads/ directory to Strapi's public/uploads/
directory on the remote server using rsync over SSH.
"""
import os
import sys
import subprocess
import argparse
from datetime import datetime


def main():
    # Parse command-line arguments
    parser = argparse.ArgumentParser(description='Migrate WordPress media to Strapi server')
    parser.add_argument('--yes', '-y', action='store_true', help='Skip confirmation prompt')
    args = parser.parse_args()

    # Configuration
    WP_UPLOADS_DIR = '/mnt/d/dropbox/frankbria.com/website/wp/wp-content/uploads/'
    REMOTE_SERVER = 'frankbria-server'
    REMOTE_UPLOADS_DIR = '/var/nodejs/frankbria-strapi/public/uploads/'

    print("=" * 70)
    print("📸 WordPress Media Migration to Strapi Server")
    print("=" * 70)
    print(f"Source: {WP_UPLOADS_DIR}")
    print(f"Target: {REMOTE_SERVER}:{REMOTE_UPLOADS_DIR}")
    print("=" * 70)

    # Verify source directory exists
    if not os.path.exists(WP_UPLOADS_DIR):
        print(f"❌ Error: Source directory not found: {WP_UPLOADS_DIR}")
        sys.exit(1)

    # Get directory stats
    print("\n📊 Analyzing source directory...")

    try:
        result = subprocess.run(
            ['find', WP_UPLOADS_DIR, '-type', 'f'],
            capture_output=True,
            text=True,
            check=True
        )
        file_count = len(result.stdout.strip().split('\n'))

        result = subprocess.run(
            ['du', '-sh', WP_UPLOADS_DIR],
            capture_output=True,
            text=True,
            check=True
        )
        total_size = result.stdout.split('\t')[0]

        print(f"   ✅ Files to transfer: {file_count:,}")
        print(f"   ✅ Total size: {total_size}")

    except subprocess.CalledProcessError as e:
        print(f"❌ Error analyzing directory: {e}")
        sys.exit(1)

    # Confirm before proceeding
    if not args.yes:
        print(f"\n⚠️  This will transfer {file_count:,} files ({total_size}) to the server.")
        confirm = input("Continue? (yes/no): ")

        if confirm.lower() != 'yes':
            print("❌ Migration cancelled.")
            sys.exit(0)
    else:
        print(f"\n✅ Auto-confirmed: Will transfer {file_count:,} files ({total_size})")

    # Test SSH connection
    print("\n🔍 Testing SSH connection...")

    try:
        result = subprocess.run(
            ['ssh', REMOTE_SERVER, 'echo "Connection successful"'],
            capture_output=True,
            text=True,
            check=True,
            timeout=10
        )
        print(f"   ✅ {result.stdout.strip()}")
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired) as e:
        print(f"❌ Error: Cannot connect to {REMOTE_SERVER}")
        print(f"   {e}")
        sys.exit(1)

    # Create remote directory if it doesn't exist
    print(f"\n📁 Ensuring remote directory exists...")

    try:
        subprocess.run(
            ['ssh', REMOTE_SERVER, f'mkdir -p {REMOTE_UPLOADS_DIR}'],
            check=True,
            timeout=10
        )
        print(f"   ✅ Remote directory ready: {REMOTE_UPLOADS_DIR}")
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired) as e:
        print(f"❌ Error creating remote directory: {e}")
        sys.exit(1)

    # Perform rsync transfer
    print(f"\n🚀 Starting media transfer (this may take several minutes)...")
    print(f"   Using rsync for efficient transfer...")

    # rsync options:
    # -a: archive mode (preserves permissions, timestamps, etc.)
    # -v: verbose
    # -z: compress during transfer
    # -h: human-readable output
    # --progress: show progress
    # --stats: show transfer statistics

    rsync_cmd = [
        'rsync',
        '-avzh',
        '--progress',
        '--stats',
        WP_UPLOADS_DIR,
        f'{REMOTE_SERVER}:{REMOTE_UPLOADS_DIR}'
    ]

    start_time = datetime.now()

    try:
        result = subprocess.run(
            rsync_cmd,
            check=True
        )

        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()

        print(f"\n{'=' * 70}")
        print(f"✅ Media migration completed successfully!")
        print(f"{'=' * 70}")
        print(f"Duration: {duration:.1f} seconds ({duration/60:.1f} minutes)")
        print(f"Files transferred: {file_count:,}")
        print(f"Total size: {total_size}")

    except subprocess.CalledProcessError as e:
        print(f"\n❌ Error during rsync transfer: {e}")
        sys.exit(1)

    # Verify some files on the server
    print(f"\n🔍 Verifying files on server...")

    try:
        result = subprocess.run(
            ['ssh', REMOTE_SERVER, f'ls -lh {REMOTE_UPLOADS_DIR} | head -10'],
            capture_output=True,
            text=True,
            check=True,
            timeout=10
        )
        print("   Sample files on server:")
        for line in result.stdout.strip().split('\n'):
            print(f"   {line}")
        print(f"   ✅ Files successfully transferred")

    except (subprocess.CalledProcessError, subprocess.TimeoutExpired) as e:
        print(f"⚠️  Warning: Could not verify files on server: {e}")

    print(f"\n{'=' * 70}")
    print("🎉 Media migration complete!")
    print(f"{'=' * 70}")
    print(f"\nNext steps:")
    print(f"1. Verify media files are accessible on server")
    print(f"2. Update Strapi configuration if needed")
    print(f"3. Test media URLs in Next.js frontend")


if __name__ == '__main__':
    main()
