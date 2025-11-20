# 🔄 Conversão .drawio para .vsdx

## ⚠️ Importante

A conversão de `.drawio` para `.vsdx` requer **Draw.io desktop** ou **app.diagrams.net** (web), pois o `.vsdx` é um formato proprietário do Microsoft Visio que requer mapeamento complexo entre formatos.

## 📋 Métodos de Conversão

### Método 1: Draw.io Web (Recomendado - Mais Rápido)

1. **Acesse o Draw.io Web**
   ```
   https://app.diagrams.net/
   ```

2. **Abra o arquivo**
   - Clique em "Open Existing Diagram"
   - Selecione `docs/diagrams/GOLFFOX_FLUXOGRAMA_COMPLETO.drawio`
   - Ou arraste e solte o arquivo na página

3. **Exporte para .vsdx**
   - Menu: `File` → `Export as` → `VSDX`
   - Configure:
     - **Filename**: `GOLFFOX_FLUXOGRAMA_COMPLETO_v1.0.0`
     - **Include a copy of my diagram**: ✅ (recomendado)
   - Clique em "Export"
   - Salve em `docs/diagrams/`

### Método 2: Draw.io Desktop App

1. **Baixe Draw.io Desktop**
   - Windows: https://github.com/jgraph/drawio-desktop/releases
   - Instale o instalador `.exe` ou `.msi`

2. **Abra o arquivo**
   - Inicie Draw.io
   - `File` → `Open` → Selecione `GOLFFOX_FLUXOGRAMA_COMPLETO.drawio`

3. **Exporte para .vsdx**
   - `File` → `Export as` → `VSDX`
   - Configure o nome e localização
   - Clique em "Export"

### Método 3: Microsoft Visio (Importação)

Se você tem Microsoft Visio 2019+:

1. **Abra o .drawio no Draw.io primeiro**
   - Exporte como `.vsdx` usando método 1 ou 2 acima

2. **Ou importe diretamente no Visio**
   - Visio 2019+: `File` → `Open` → Selecione `.drawio`
   - Visio irá converter automaticamente (pode ter limitações)

## ✅ Verificação Pós-Conversão

Após a conversão, verifique:

- [ ] Todos os elementos estão visíveis
- [ ] Cores estão corretas
- [ ] Textos estão legíveis
- [ ] Conexões (setas) estão preservadas
- [ ] Metadados (cabeçalho/rodapé) estão presentes
- [ ] Tamanho da página: 29.7cm x 21cm (A4 landscape)

## 🔧 Script Automatizado (Alternativa)

Se você tiver Node.js instalado, pode usar o script abaixo (requer Draw.io CLI):

```bash
# Instalar Draw.io CLI (opcional)
npm install -g @drawio/cli

# Converter
drawio --export --format vsdx --output docs/diagrams/GOLFFOX_FLUXOGRAMA_COMPLETO_v1.0.0.vsdx docs/diagrams/GOLFFOX_FLUXOGRAMA_COMPLETO.drawio
```

## 📝 Notas Técnicas

### Formato .vsdx

- `.vsdx` é um arquivo ZIP contendo XMLs estruturados
- Formato proprietário do Microsoft Visio
- Suporta edição completa no Visio
- Compatível com Visio 2013+

### Limitações de Conversão

Algumas características podem ser perdidas ou precisarem ajuste:

- **Estilos personalizados**: Podem precisar ser reaplicados no Visio
- **Formas complexas**: Podem ser simplificadas
- **Fontes**: Verifique se as fontes estão instaladas no Visio
- **Metadados**: Alguns metadados podem precisar ser reaplicados

## 🚀 Quick Start

**Opção mais rápida (sem instalação):**

1. Acesse: https://app.diagrams.net/
2. Arraste o arquivo `GOLFFOX_FLUXOGRAMA_COMPLETO.drawio`
3. `File` → `Export as` → `VSDX`
4. Download automático do arquivo `.vsdx`

**Tempo estimado: 30 segundos**

---

**Última atualização**: 11/01/2025  
**Método recomendado**: Draw.io Web (app.diagrams.net)
