#!/usr/bin/env python3
"""
Script para converter e validar o fluxograma GolfFox
Compatível com .drawio (Draw.io) e .vsdx (Visio)

Requisitos:
    pip install python-docx lxml pillow

Uso:
    python convert-to-vsdx.py --input GOLFFOX_FLUXOGRAMA_COMPLETO.drawio --format vsdx
"""

import argparse
import xml.etree.ElementTree as ET
import sys
import os
from pathlib import Path
from datetime import datetime

def validate_drawio_file(file_path):
    """Valida se o arquivo .drawio é válido"""
    try:
        tree = ET.parse(file_path)
        root = tree.getroot()
        
        if root.tag != 'mxfile':
            return False, "Arquivo não é um formato Draw.io válido"
        
        # Verifica metadados obrigatórios
        diagram_id = root.get('etag')
        if not diagram_id:
            return False, "Falta etag (ID do documento)"
        
        return True, "Arquivo válido"
    
    except ET.ParseError as e:
        return False, f"Erro ao analisar XML: {e}"
    except Exception as e:
        return False, f"Erro inesperado: {e}"

def extract_metadata(file_path):
    """Extrai metadados do arquivo .drawio"""
    try:
        tree = ET.parse(file_path)
        root = tree.getroot()
        
        metadata = {
            'id': root.get('etag', 'N/A'),
            'version': root.get('version', 'N/A'),
            'agent': root.get('agent', 'N/A'),
            'modified': root.get('modified', 'N/A'),
        }
        
        # Tenta encontrar o cabeçalho
        for cell in root.iter('mxCell'):
            if cell.get('id') == 'header':
                value = cell.get('value', '')
                if 'v' in value and '.' in value:
                    # Extrai versão do texto
                    parts = value.split('v')
                    if len(parts) > 1:
                        version = parts[1].split()[0] if ' ' in parts[1] else parts[1]
                        metadata['version'] = version
        
        return metadata
    
    except Exception as e:
        print(f"Erro ao extrair metadados: {e}")
        return {}

def check_quality_checklist(file_path):
    """Executa checklist de qualidade básico"""
    try:
        tree = ET.parse(file_path)
        root = tree.getroot()
        
        checklist = {
            'elements_named': False,
            'header_present': False,
            'footer_present': False,
            'metadata_complete': False,
        }
        
        cells = list(root.iter('mxCell'))
        elements_count = len([c for c in cells if c.get('id') and c.get('id') != '0' and c.get('id') != '1'])
        
        # Verifica se elementos têm IDs
        if elements_count > 0:
            checklist['elements_named'] = True
        
        # Verifica cabeçalho
        header = root.find(".//mxCell[@id='header']")
        if header is not None:
            checklist['header_present'] = True
        
        # Verifica rodapé
        footer = root.find(".//mxCell[@id='footer']")
        if footer is not None:
            checklist['footer_present'] = True
        
        # Verifica metadados
        if root.get('etag') and root.get('version'):
            checklist['metadata_complete'] = True
        
        return checklist, elements_count
    
    except Exception as e:
        print(f"Erro no checklist: {e}")
        return {}, 0

def print_report(file_path):
    """Imprime relatório de validação"""
    print("=" * 60)
    print("RELATÓRIO DE VALIDAÇÃO - GOLFFOX FLUXOGRAMA")
    print("=" * 60)
    print(f"Arquivo: {file_path}")
    print(f"Data: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
    print()
    
    # Validação
    is_valid, message = validate_drawio_file(file_path)
    print(f"Validação: {'✓ VÁLIDO' if is_valid else '✗ INVÁLIDO'}")
    print(f"  {message}")
    print()
    
    if not is_valid:
        return
    
    # Metadados
    metadata = extract_metadata(file_path)
    print("Metadados:")
    for key, value in metadata.items():
        print(f"  {key}: {value}")
    print()
    
    # Checklist
    checklist, count = check_quality_checklist(file_path)
    print("Checklist de Qualidade:")
    print(f"  Elementos nomeados: {'✓' if checklist.get('elements_named') else '✗'} ({count} elementos)")
    print(f"  Cabeçalho presente: {'✓' if checklist.get('header_present') else '✗'}")
    print(f"  Rodapé presente: {'✓' if checklist.get('footer_present') else '✗'}")
    print(f"  Metadados completos: {'✓' if checklist.get('metadata_complete') else '✗'}")
    print()
    
    # Recomendações
    print("Recomendações:")
    if not checklist.get('header_present'):
        print("  - Adicionar cabeçalho com metadados")
    if not checklist.get('footer_present'):
        print("  - Adicionar rodapé com informações do arquivo")
    if not checklist.get('metadata_complete'):
        print("  - Completar metadados no elemento mxfile")
    print()

def main():
    parser = argparse.ArgumentParser(
        description='Valida e converte fluxograma GolfFox',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exemplos:
  # Validar arquivo
  python convert-to-vsdx.py --input GOLFFOX_FLUXOGRAMA_COMPLETO.drawio --validate
  
  # Validar e gerar relatório
  python convert-to-vsdx.py --input GOLFFOX_FLUXOGRAMA_COMPLETO.drawio --report
        """
    )
    
    parser.add_argument(
        '--input',
        type=str,
        required=True,
        help='Arquivo .drawio de entrada'
    )
    
    parser.add_argument(
        '--format',
        type=str,
        choices=['vsdx', 'png', 'pdf', 'svg'],
        help='Formato de exportação (requer Draw.io instalado)'
    )
    
    parser.add_argument(
        '--validate',
        action='store_true',
        help='Apenas validar o arquivo'
    )
    
    parser.add_argument(
        '--report',
        action='store_true',
        help='Gerar relatório detalhado'
    )
    
    args = parser.parse_args()
    
    if not os.path.exists(args.input):
        print(f"Erro: Arquivo '{args.input}' não encontrado")
        sys.exit(1)
    
    if args.validate or args.report:
        print_report(args.input)
    
    if args.format:
        print(f"⚠️ Conversão para {args.format.upper()} requer Draw.io desktop ou API")
        print("   Use Draw.io (draw.io) para exportar manualmente:")
        print(f"   1. Abra {args.input}")
        print(f"   2. File > Export as > {args.format.upper()}")
        print(f"   3. Configure: 300dpi (PNG), A4 (PDF), vetorial (SVG)")

if __name__ == '__main__':
    main()
