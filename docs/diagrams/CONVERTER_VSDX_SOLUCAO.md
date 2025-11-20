# 🔄 Solução de Conversão .drawio para .vsdx

## ⚠️ Problema Identificado

O Draw.io Web (`app.diagrams.net`) **não oferece exportação direta para .vsdx**. Essa opção geralmente está disponível apenas no **Draw.io Desktop**.

## ✅ Soluções Disponíveis

### **Solução 1: Draw.io Desktop (Recomendado)**

A versão desktop tem suporte completo para exportação `.vsdx`.

#### Passo a Passo:

1. **Baixar Draw.io Desktop**
   - Windows: https://github.com/jgraph/drawio-desktop/releases/latest
   - Baixe: `draw.io-Setup-X.X.X.exe` (ou `.msi`)
   - Instale normalmente

2. **Abrir o arquivo**
   - Inicie Draw.io Desktop
   - `File` → `Open` → Navegue até `docs\diagrams\GOLFFOX_FLUXOGRAMA_COMPLETO.drawio`
   - Clique em "Open"

3. **Exportar para .vsdx**
   - `File` → `Export as` → **`VSDX...`** (deve aparecer nesta versão)
   - Configure:
     - **Filename**: `GOLFFOX_FLUXOGRAMA_COMPLETO_v1.0.0.vsdx`
     - **Include a copy of my diagram**: ✅ (opcional)
   - Clique em "Export"
   - Salve em `docs\diagrams\`

---

### **Solução 2: Exportar para SVG e Importar no Visio**

Se você tem Microsoft Visio instalado, pode usar SVG como intermediário.

#### Passo a Passo:

1. **No Draw.io Web:**
   - `File` → `Export as` → **`SVG...`**
   - Configure: 300dpi, fundo transparente
   - Exporte como `GOLFFOX_FLUXOGRAMA_COMPLETO.svg`

2. **No Microsoft Visio:**
   - Abra Visio
   - `File` → `Open` → Selecione o `.svg`
   - Visio irá importar o SVG
   - `File` → `Save As` → Escolha formato `.vsdx`
   - Salve como `GOLFFOX_FLUXOGRAMA_COMPLETO_v1.0.0.vsdx`

**Limitações**: Algumas características podem ser perdidas (cores, conexões, textos)

---

### **Solução 3: Usar Draw.io CLI (Avançado)**

Se você tem Node.js instalado:

```bash
# Instalar Draw.io CLI
npm install -g @drawio/cli

# Converter
cd docs\diagrams
drawio --export --format vsdx --output GOLFFOX_FLUXOGRAMA_COMPLETO_v1.0.0.vsdx GOLFFOX_FLUXOGRAMA_COMPLETO.drawio
```

**Nota**: Requer Node.js e pode não estar disponível em todos os sistemas.

---

### **Solução 4: Exportar para PDF/PNG (Alternativa)**

Se você precisa apenas visualizar ou compartilhar, pode exportar para PDF:

1. **No Draw.io Web:**
   - `File` → `Export as` → **`PDF...`**
   - Configure: Formato A4, orientação paisagem
   - Exporte como `GOLFFOX_FLUXOGRAMA_COMPLETO_v1.0.0.pdf`

**Vantagens**: Mantém formato, cores e layout perfeitamente  
**Desvantagem**: Não é editável como `.vsdx`

---

### **Solução 5: Usar Lucidchart (Alternativa)**

Lucidchart suporta importação de `.drawio` e exportação para `.vsdx`:

1. Acesse: https://www.lucidchart.com/
2. Crie uma conta (gratuita)
3. `Import` → `Import File` → Selecione `.drawio`
4. Aguarde a importação
5. `File` → `Export` → `Microsoft Visio (.vsdx)`
6. Download automático

---

## 🎯 Recomendação Final

**Para melhor compatibilidade e preservação de características:**

1. **Use Draw.io Desktop** (Solução 1)
   - ✅ Suporte nativo para .vsdx
   - ✅ Preserva todos os elementos
   - ✅ Gratuito e open-source

2. **Ou use SVG → Visio** (Solução 2)
   - ✅ Funciona se você tem Visio
   - ⚠️ Pode perder algumas características

## 📋 Verificação Pós-Conversão

Após converter, verifique:

- [ ] Todos os elementos visíveis
- [ ] Cores preservadas
- [ ] Textos legíveis
- [ ] Conexões (setas) presentes
- [ ] Tamanho da página: 29.7cm x 21cm (A4 landscape)
- [ ] Metadados (cabeçalho/rodapé) visíveis

---

## 🚀 Quick Start (Draw.io Desktop)

**Tempo estimado: 2 minutos**

1. Baixe: https://github.com/jgraph/drawio-desktop/releases/latest
2. Instale
3. Abra: `docs\diagrams\GOLFFOX_FLUXOGRAMA_COMPLETO.drawio`
4. `File` → `Export as` → `VSDX`
5. Salve em `docs\diagrams\`

**Pronto! ✅**

---

**Última atualização**: 11/01/2025  
**Método recomendado**: Draw.io Desktop
