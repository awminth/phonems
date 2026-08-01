import subprocess

with open('build_log_full.txt', 'w') as f:
    try:
        result = subprocess.run(['npm', 'run', 'build'], shell=True, check=False, stdout=f, stderr=subprocess.STDOUT)
        print(f"Build finished with code {result.returncode}")
    except Exception as e:
        print(f"Error: {e}")
