import os
import fnmatch
from pathlib import Path

def should_ignore(path, ignore_patterns):
    """Kiểm tra xem đường dẫn có nên bị bỏ qua không"""
    path_str = str(path)
    for pattern in ignore_patterns:
        if pattern in path_str or fnmatch.fnmatch(path_str, pattern):
            return True
    return False

def get_code_from_angular_project(root_folder=None, output_file='output.txt'):
    """
    Lấy code từ tất cả các file trong Angular project
    
    Args:
        root_folder: Đường dẫn đến folder gốc của project (None = folder hiện tại)
        output_file: Tên file output để lưu kết quả
    """
    
    # Nếu không truyền root_folder, lấy folder hiện tại (nơi file Python đang chạy)
    if root_folder is None:
        root_folder = os.path.dirname(os.path.abspath(__file__))
    
    root_folder = Path(root_folder)
    
    print(f"Scanning folder: {root_folder}")
    print(f"{'='*80}\n")
    
    # Các thư mục và file cần bỏ qua
    ignore_patterns = [
        'node_modules',
        'dist',
        '.angular',
        'coverage',
        '.git',
        '.vscode',
        '.idea',
        '*.map',
        'package-lock.json',
        'yarn.lock',
        '__pycache__',
        '*.pyc'
    ]
    
    # Các extension file cần lấy
    code_extensions = [
        '.ts',      # TypeScript
        '.html',    # HTML templates
        '.css',     # CSS
        '.scss',    # SCSS
        '.sass',    # SASS
        '.less',    # LESS
        '.js',      # JavaScript
        '.json',    # JSON (config files)
    ]
    
    results = []
    file_count = 0
    total_lines = 0
    
    # Duyệt qua tất cả các file trong folder
    for root, dirs, files in os.walk(root_folder):
        # Bỏ qua các thư mục không cần thiết
        dirs[:] = [d for d in dirs if not should_ignore(Path(root) / d, ignore_patterns)]
        
        for file in files:
            file_path = Path(root) / file
            
            # Kiểm tra extension
            if file_path.suffix in code_extensions:
                # Kiểm tra ignore patterns
                if should_ignore(file_path, ignore_patterns):
                    continue
                
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        lines = content.split('\n')
                        
                        # Thêm thông tin file với đường dẫn đầy đủ
                        results.append(f"\n{'='*80}")
                        results.append(f"File: {file}")
                        results.append(f"Relative Path: {file_path.relative_to(root_folder)}")
                        results.append(f"Full Path: {file_path.absolute()}")
                        results.append(f"Extension: {file_path.suffix}")
                        results.append(f"Lines: {len(lines)}")
                        results.append(f"{'='*80}\n")
                        results.append(content)
                        
                        file_count += 1
                        total_lines += len(lines)
                        
                        print(f"✓ Processed: {file_path.relative_to(root_folder)}")
                        
                except Exception as e:
                    print(f"✗ Error reading {file_path}: {e}")
    
    # Ghi kết quả vào file
    output_path = Path(root_folder) / output_file
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(f"Angular Project Code Extract\n")
        f.write(f"{'='*80}\n")
        f.write(f"Root Folder: {root_folder.absolute()}\n")
        f.write(f"Scan Date: {os.popen('date /t').read().strip() if os.name == 'nt' else os.popen('date').read().strip()}\n")
        f.write(f"Total files: {file_count}\n")
        f.write(f"Total lines: {total_lines}\n")
        f.write(f"{'='*80}\n\n")
        f.write('\n'.join(results))
    
    print(f"\n{'='*80}")
    print(f"Summary:")
    print(f"  Root folder: {root_folder.absolute()}")
    print(f"  Total files processed: {file_count}")
    print(f"  Total lines of code: {total_lines}")
    print(f"  Output saved to: {output_path.absolute()}")
    print(f"{'='*80}")
    
    return file_count, total_lines


def get_code_by_type(root_folder=None):
    """
    Lấy code và phân loại theo loại file
    """
    # Nếu không truyền root_folder, lấy folder hiện tại
    if root_folder is None:
        root_folder = os.path.dirname(os.path.abspath(__file__))
    
    root_folder = Path(root_folder)
    
    print(f"Scanning folder: {root_folder}")
    print(f"{'='*80}\n")
    
    ignore_patterns = [
        'node_modules', 'dist', '.angular', 'coverage', '.git',
        '.vscode', '.idea', '*.map', 'package-lock.json', 'yarn.lock',
        '__pycache__', '*.pyc'
    ]
    
    categorized = {
        'TypeScript': [],
        'HTML': [],
        'Styles': [],
        'Config': []
    }
    
    for root, dirs, files in os.walk(root_folder):
        dirs[:] = [d for d in dirs if not should_ignore(Path(root) / d, ignore_patterns)]
        
        for file in files:
            file_path = Path(root) / file
            
            if should_ignore(file_path, ignore_patterns):
                continue
            
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    rel_path = file_path.relative_to(root_folder)
                    full_path = file_path.absolute()
                    
                    file_info = {
                        'name': file,
                        'relative': rel_path,
                        'full': full_path,
                        'content': content
                    }
                    
                    if file_path.suffix == '.ts':
                        categorized['TypeScript'].append(file_info)
                    elif file_path.suffix == '.html':
                        categorized['HTML'].append(file_info)
                    elif file_path.suffix in ['.css', '.scss', '.sass', '.less']:
                        categorized['Styles'].append(file_info)
                    elif file_path.suffix == '.json':
                        categorized['Config'].append(file_info)
                        
            except Exception as e:
                print(f"Error: {e}")
    
    # Lưu theo từng loại
    for category, files in categorized.items():
        if files:
            output_file = root_folder / f'output_{category.lower()}.txt'
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(f"{category} Files\n")
                f.write(f"{'='*80}\n")
                f.write(f"Root Folder: {root_folder.absolute()}\n")
                f.write(f"Total {category} files: {len(files)}\n")
                f.write(f"{'='*80}\n\n")
                
                for file_info in files:
                    f.write(f"\n{'='*80}\n")
                    f.write(f"File Name: {file_info['name']}\n")
                    f.write(f"Relative Path: {file_info['relative']}\n")
                    f.write(f"Full Path: {file_info['full']}\n")
                    f.write(f"{'='*80}\n\n")
                    f.write(file_info['content'])
                    f.write("\n\n")
            print(f"✓ Saved {len(files)} {category} files to {output_file}")


def scan_specific_folder(folder_path, output_file='output.txt'):
    """
    Scan một folder cụ thể
    """
    return get_code_from_angular_project(folder_path, output_file)


# Sử dụng
if __name__ == "__main__":
    print("Angular Project Code Extractor")
    print(f"{'='*80}\n")
    
    # Lựa chọn 1: Tự động lấy folder hiện tại (nơi file Python này nằm)
    print("Option 1: Scanning current folder...")
    get_code_from_angular_project(output_file='all_code.txt')
    
    # Lựa chọn 2: Phân loại theo từng loại file từ folder hiện tại
    # print("\nOption 2: Categorizing by file type...")
    # get_code_by_type()
    
    # Lựa chọn 3: Scan một folder cụ thể
    # scan_specific_folder(r"C:\path\to\your\angular\project", "custom_output.txt")