import pdfplumber
import os

def extract_resume_text(pdf_path: str) -> str:
    """
    PDF에서 텍스트를 추출해 LLM에 넘길 문자열로 변환
    """
    result = []

    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                result.append(text.strip())

            tables = page.extract_tables()
            for table in tables:
                if not table:
                    continue

            # 헤더
            header = "| " + " | ".join(
                str(cell or "") for cell in table[0]
            ) + " |"
            separator = "| " + " | ".join(
                "---" for _ in table[0]
            ) + " |"

            # 데이터 행
            rows = [
                "| " + " | ".join(str(cell or "") for cell in row) + " |"
                for row in table[1:]
            ]

            md_table = "\n".join([header, separator] + rows)
            result.append(md_table)
    
    print(result)

    return "\n\n".join(result)

def is_scanned_pdf(pdf_path: str) -> bool:
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            if page.extract_text():
                return False  # 텍스트 있으면 일반 PDF
    return True  # 텍스트 없으면 스캔 PDF

if __name__ == "__main__":
    current_dir = os.path.dirname(os.path.abspath(__file__))

    parent_dir = os.path.dirname(current_dir)

    pdf_path = os.path.join(parent_dir, "Test.pdf")

    if(is_scanned_pdf(pdf_path) == False):       
        extract_resume_text(pdf_path)