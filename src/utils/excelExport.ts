import { Venta, Cliente, Producto, MovimientoCaja, ConfiguracionPulperia } from '../types';

interface FinancialExportData {
  config: ConfiguracionPulperia;
  periodLabel: string;
  stats: {
    totalVentas: number;
    gananciaTotal: number;
    totalTransacciones: number;
    ticketPromedio: number;
    margenPorcentaje: number;
    ventasContado: number;
    ventasCredito: number;
    totalFiadosPendientes: number;
    clientesConDeuda: number;
    valorInventarioVenta: number;
    valorInventarioCosto: number;
    gananciaPotencialInventario: number;
    totalUnidadesStock: number;
  };
  ventas: Venta[];
  clientes: Cliente[];
  productos: Producto[];
  categoryData: { categoria: string; total: number; unidades: number }[];
  topProductsData: { id: string; nombre: string; cantidad: number; total: number; unidad: string }[];
}

function escapeXml(value: any): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Genera un archivo con formato XML Spreadsheet (SpreadsheetML de Microsoft Excel / LibreOffice Calc)
 * con anchos de columna definidos, estilos nativos de bordes, tipografías y formatos numéricos,
 * asegurando que en LibreOffice Calc y Microsoft Excel no haya columnas apretadas ni textos recortados.
 */
export function exportFinancialReportToExcel(data: FinancialExportData) {
  const { config, periodLabel, stats, ventas, clientes, productos, categoryData, topProductsData } = data;
  const now = new Date();
  const dateStr = now.toLocaleDateString('es-NI', { year: 'numeric', month: '2-digit', day: '2-digit' });
  const timeStr = now.toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit' });

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Title>${escapeXml(config.nombre_negocio)} - Informe Financiero</Title>
  <Author>${escapeXml(config.nombre_negocio)}</Author>
  <Created>${now.toISOString()}</Created>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Borders/>
   <Font ss:FontName="Segoe UI" x:Family="Swiss" ss:Size="10" ss:Color="#1E293B"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <!-- Titulo Principal Verde Pulpería -->
  <Style ss:ID="sHeaderTitle">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="14" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#065F46" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="sHeaderSubtitle">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Bold="1" ss:Color="#ECFDF5"/>
   <Interior ss:Color="#047857" ss:Pattern="Solid"/>
  </Style>
  <!-- Encabezado de Sección Azul Oscuro -->
  <Style ss:ID="sSectionTitle">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center" ss:Indent="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#0F172A"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#0F172A" ss:Pattern="Solid"/>
  </Style>
  <!-- Cabecera de Tabla Gris Oscuro -->
  <Style ss:ID="sColHeader">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#64748B"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#64748B"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#64748B"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#64748B"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#1E293B" ss:Pattern="Solid"/>
  </Style>
  <!-- Celda Estándar con Bordes -->
  <Style ss:ID="sCell">
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="10"/>
  </Style>
  <!-- Celda Estándar Negrita -->
  <Style ss:ID="sCellBold">
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1"/>
  </Style>
  <!-- Celda Estándar Alternada -->
  <Style ss:ID="sCellAlt">
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="10"/>
   <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
  </Style>
  <!-- Celda Centro -->
  <Style ss:ID="sCenter">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="10"/>
  </Style>
  <!-- Moneda con Formato Profesional -->
  <Style ss:ID="sCurrency">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1"/>
   <NumberFormat ss:Format="#,##0.00"/>
  </Style>
  <Style ss:ID="sCurrencyGreen">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#166534"/>
   <Interior ss:Color="#DCFCE7" ss:Pattern="Solid"/>
   <NumberFormat ss:Format="#,##0.00"/>
  </Style>
  <Style ss:ID="sCurrencyAmber">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#92400E"/>
   <Interior ss:Color="#FEF3C7" ss:Pattern="Solid"/>
   <NumberFormat ss:Format="#,##0.00"/>
  </Style>
  <Style ss:ID="sTotalRow">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3" ss:Color="#0F172A"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#0F172A"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#0F172A"/>
   <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="sTotalCurrency">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3" ss:Color="#0F172A"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#0F172A"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="11" ss:Bold="1" ss:Color="#065F46"/>
   <Interior ss:Color="#E2E8F0" ss:Pattern="Solid"/>
   <NumberFormat ss:Format="#,##0.00"/>
  </Style>
  <Style ss:ID="sFooter">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Color="#64748B"/>
  </Style>
 </Styles>

 <Worksheet ss:Name="Informe Financiero">
  <Table ss:DefaultRowHeight="20">
   <!-- Columnas amplias para evitar que en LibreOffice Calc se apriete o recorte texto -->
   <Column ss:Index="1" ss:Width="260"/>
   <Column ss:Index="2" ss:Width="130"/>
   <Column ss:Index="3" ss:Width="160"/>
   <Column ss:Index="4" ss:Width="240"/>
   <Column ss:Index="5" ss:Width="120"/>
   <Column ss:Index="6" ss:Width="130"/>
   <Column ss:Index="7" ss:Width="130"/>

   <!-- 1. ENCABEZADO PRINCIPAL -->
   <Row ss:Height="30">
    <Cell ss:MergeAcross="6" ss:StyleID="sHeaderTitle"><Data ss:Type="String">${escapeXml(config.nombre_negocio)} - INFORME FINANCIERO Y CONTABLE</Data></Cell>
   </Row>
   <Row ss:Height="22">
    <Cell ss:MergeAcross="6" ss:StyleID="sHeaderSubtitle"><Data ss:Type="String">Moneda: ${escapeXml(config.moneda_simbolo)} (Córdobas Nicaragüenses NIO)  |  Período: ${escapeXml(periodLabel.toUpperCase())}  |  Generado: ${escapeXml(dateStr)} ${escapeXml(timeStr)}</Data></Cell>
   </Row>
   <Row ss:Height="12"></Row>

   <!-- 2. RESUMEN EJECUTIVO Y ESTADO DE RESULTADOS -->
   <Row ss:Height="24">
    <Cell ss:MergeAcross="3" ss:StyleID="sSectionTitle"><Data ss:Type="String">1. RESUMEN EJECUTIVO Y ESTADO DE RESULTADOS (${escapeXml(periodLabel.toUpperCase())})</Data></Cell>
   </Row>
   <Row ss:Height="22">
    <Cell ss:StyleID="sColHeader"><Data ss:Type="String">Concepto / Métrica</Data></Cell>
    <Cell ss:StyleID="sColHeader"><Data ss:Type="String">Valor (${escapeXml(config.moneda_simbolo)})</Data></Cell>
    <Cell ss:StyleID="sColHeader"><Data ss:Type="String">Unidades / Transacciones</Data></Cell>
    <Cell ss:StyleID="sColHeader"><Data ss:Type="String">Observación / Rendimiento</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="sCellBold"><Data ss:Type="String">Ingresos Totales por Ventas</Data></Cell>
    <Cell ss:StyleID="sCurrencyGreen"><Data ss:Type="Number">${stats.totalVentas}</Data></Cell>
    <Cell ss:StyleID="sCenter"><Data ss:Type="String">${stats.totalTransacciones} ventas</Data></Cell>
    <Cell ss:StyleID="sCell"><Data ss:Type="String">Facturación en el período</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="sCellAlt"><Data ss:Type="String">  • Ventas de Contado (Efectivo disponible)</Data></Cell>
    <Cell ss:StyleID="sCurrency"><Data ss:Type="Number">${stats.ventasContado}</Data></Cell>
    <Cell ss:StyleID="sCenter"><Data ss:Type="String">${ventas.filter(v => v.tipo === 'contado').length} ventas</Data></Cell>
    <Cell ss:StyleID="sCellAlt"><Data ss:Type="String">${stats.totalVentas > 0 ? ((stats.ventasContado / stats.totalVentas) * 100).toFixed(1) : 0}% de las ventas</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="sCell"><Data ss:Type="String">  • Ventas a Crédito (Fiado en cartera)</Data></Cell>
    <Cell ss:StyleID="sCurrency"><Data ss:Type="Number">${stats.ventasCredito}</Data></Cell>
    <Cell ss:StyleID="sCenter"><Data ss:Type="String">${ventas.filter(v => v.tipo === 'credito').length} ventas</Data></Cell>
    <Cell ss:StyleID="sCell"><Data ss:Type="String">${stats.totalVentas > 0 ? ((stats.ventasCredito / stats.totalVentas) * 100).toFixed(1) : 0}% de las ventas</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="sCellBold"><Data ss:Type="String">Ganancia Neta Estimada (Utilidad Bruta)</Data></Cell>
    <Cell ss:StyleID="sCurrencyGreen"><Data ss:Type="Number">${stats.gananciaTotal}</Data></Cell>
    <Cell ss:StyleID="sCenter"><Data ss:Type="String">-</Data></Cell>
    <Cell ss:StyleID="sCellBold"><Data ss:Type="String">${stats.margenPorcentaje.toFixed(1)}% Margen de Utilidad</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="sCellBold"><Data ss:Type="String">Ticket Promedio de Venta</Data></Cell>
    <Cell ss:StyleID="sCurrency"><Data ss:Type="Number">${stats.ticketPromedio}</Data></Cell>
    <Cell ss:StyleID="sCenter"><Data ss:Type="String">-</Data></Cell>
    <Cell ss:StyleID="sCell"><Data ss:Type="String">Promedio consumido por cliente</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="sCellBold"><Data ss:Type="String">Cuentas por Cobrar Totales (Libreta de Fiados)</Data></Cell>
    <Cell ss:StyleID="sCurrencyAmber"><Data ss:Type="Number">${stats.totalFiadosPendientes}</Data></Cell>
    <Cell ss:StyleID="sCenter"><Data ss:Type="String">${stats.clientesConDeuda} clientes con saldo</Data></Cell>
    <Cell ss:StyleID="sCell"><Data ss:Type="String">Cartera de crédito pendiente</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="sCellBold"><Data ss:Type="String">Valoración de Inventario a Precio de Venta</Data></Cell>
    <Cell ss:StyleID="sCurrency"><Data ss:Type="Number">${stats.valorInventarioVenta}</Data></Cell>
    <Cell ss:StyleID="sCenter"><Data ss:Type="String">${stats.totalUnidadesStock} unidades físicas</Data></Cell>
    <Cell ss:StyleID="sCell"><Data ss:Type="String">Valor de venta en estantería</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="sCellAlt"><Data ss:Type="String">  • Valor de Inventario a Precio de Costo</Data></Cell>
    <Cell ss:StyleID="sCurrency"><Data ss:Type="Number">${stats.valorInventarioCosto}</Data></Cell>
    <Cell ss:StyleID="sCenter"><Data ss:Type="String">${productos.length} productos distintos</Data></Cell>
    <Cell ss:StyleID="sCellAlt"><Data ss:Type="String">Capital invertido</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="sCellBold"><Data ss:Type="String">  • Ganancia Proyectada del Inventario</Data></Cell>
    <Cell ss:StyleID="sCurrencyGreen"><Data ss:Type="Number">${stats.gananciaPotencialInventario}</Data></Cell>
    <Cell ss:StyleID="sCenter"><Data ss:Type="String">-</Data></Cell>
    <Cell ss:StyleID="sCell"><Data ss:Type="String">Utilidad al vender todo el stock</Data></Cell>
   </Row>
   <Row ss:Height="14"></Row>

   <!-- 3. DETALLE DE VENTAS DEL PERÍODO -->
   <Row ss:Height="24">
    <Cell ss:MergeAcross="6" ss:StyleID="sSectionTitle"><Data ss:Type="String">2. DETALLE DE TRANSACCIONES Y VENTAS REGISTRADAS (${ventas.length} registros)</Data></Cell>
   </Row>
   <Row ss:Height="22">
    <Cell ss:StyleID="sColHeader"><Data ss:Type="String">Folio / ID</Data></Cell>
    <Cell ss:StyleID="sColHeader"><Data ss:Type="String">Fecha y Hora</Data></Cell>
    <Cell ss:StyleID="sColHeader"><Data ss:Type="String">Modalidad</Data></Cell>
    <Cell ss:StyleID="sColHeader"><Data ss:Type="String">Cliente / Destino</Data></Cell>
    <Cell ss:StyleID="sColHeader"><Data ss:Type="String">Cant. Artículos</Data></Cell>
    <Cell ss:StyleID="sColHeader"><Data ss:Type="String">Total Venta (${escapeXml(config.moneda_simbolo)})</Data></Cell>
    <Cell ss:StyleID="sColHeader"><Data ss:Type="String">Ganancia Est. (${escapeXml(config.moneda_simbolo)})</Data></Cell>
   </Row>
   ${
     ventas.length === 0
       ? `<Row><Cell ss:MergeAcross="6" ss:StyleID="sCenter"><Data ss:Type="String">No hay ventas registradas en este período</Data></Cell></Row>`
       : ventas
           .map((v) => {
             const totalItems = v.items.reduce((acc, it) => acc + it.cantidad, 0);
             const tipoLabel = v.tipo === 'credito' ? 'FIADO (CRÉDITO)' : 'CONTADO (EFECTIVO)';
             const clienteDesc = v.cliente_nombre || (v.tipo === 'credito' ? 'Cliente Fiador' : 'Cliente General');
             return `
   <Row>
    <Cell ss:StyleID="sCenter"><Data ss:Type="String">${escapeXml(v.id.substring(0, 8))}</Data></Cell>
    <Cell ss:StyleID="sCenter"><Data ss:Type="String">${escapeXml(v.fecha_hora)}</Data></Cell>
    <Cell ss:StyleID="sCenter"><Data ss:Type="String">${escapeXml(tipoLabel)}</Data></Cell>
    <Cell ss:StyleID="sCell"><Data ss:Type="String">${escapeXml(clienteDesc)}</Data></Cell>
    <Cell ss:StyleID="sCenter"><Data ss:Type="Number">${totalItems}</Data></Cell>
    <Cell ss:StyleID="sCurrency"><Data ss:Type="Number">${v.total}</Data></Cell>
    <Cell ss:StyleID="sCurrency"><Data ss:Type="Number">${v.ganancia_estimada || 0}</Data></Cell>
   </Row>`;
           })
           .join('')
   }
   <Row ss:Height="22">
    <Cell ss:MergeAcross="4" ss:StyleID="sTotalRow"><Data ss:Type="String">TOTALES DEL PERÍODO:</Data></Cell>
    <Cell ss:StyleID="sTotalCurrency"><Data ss:Type="Number">${stats.totalVentas}</Data></Cell>
    <Cell ss:StyleID="sTotalCurrency"><Data ss:Type="Number">${stats.gananciaTotal}</Data></Cell>
   </Row>
   <Row ss:Height="14"></Row>

   <!-- 4. PRODUCTOS CON MAYOR ROTACIÓN -->
   <Row ss:Height="24">
    <Cell ss:MergeAcross="4" ss:StyleID="sSectionTitle"><Data ss:Type="String">3. PRODUCTOS CON MAYOR ROTACIÓN Y VENTA</Data></Cell>
   </Row>
   <Row ss:Height="22">
    <Cell ss:StyleID="sColHeader"><Data ss:Type="String">#</Data></Cell>
    <Cell ss:StyleID="sColHeader"><Data ss:Type="String">Producto</Data></Cell>
    <Cell ss:StyleID="sColHeader"><Data ss:Type="String">Unidades Vendidas</Data></Cell>
    <Cell ss:StyleID="sColHeader"><Data ss:Type="String">Total Generado (${escapeXml(config.moneda_simbolo)})</Data></Cell>
    <Cell ss:StyleID="sColHeader"><Data ss:Type="String">Unidad de Medida</Data></Cell>
   </Row>
   ${
     topProductsData.length === 0
       ? `<Row><Cell ss:MergeAcross="4" ss:StyleID="sCenter"><Data ss:Type="String">Sin rotación de productos en este período</Data></Cell></Row>`
       : topProductsData
           .map(
             (p, idx) => `
   <Row>
    <Cell ss:StyleID="sCenter"><Data ss:Type="Number">${idx + 1}</Data></Cell>
    <Cell ss:StyleID="sCellBold"><Data ss:Type="String">${escapeXml(p.nombre)}</Data></Cell>
    <Cell ss:StyleID="sCenter"><Data ss:Type="Number">${p.cantidad}</Data></Cell>
    <Cell ss:StyleID="sCurrencyGreen"><Data ss:Type="Number">${p.total}</Data></Cell>
    <Cell ss:StyleID="sCenter"><Data ss:Type="String">${escapeXml(p.unidad)}</Data></Cell>
   </Row>`
           )
           .join('')
   }
   <Row ss:Height="14"></Row>

   <!-- 5. VENTAS POR CATEGORÍA -->
   <Row ss:Height="24">
    <Cell ss:MergeAcross="3" ss:StyleID="sSectionTitle"><Data ss:Type="String">4. VENTAS AGRUPADAS POR CATEGORÍA</Data></Cell>
   </Row>
   <Row ss:Height="22">
    <Cell ss:StyleID="sColHeader"><Data ss:Type="String">Categoría</Data></Cell>
    <Cell ss:StyleID="sColHeader"><Data ss:Type="String">Unidades Vendidas</Data></Cell>
    <Cell ss:StyleID="sColHeader"><Data ss:Type="String">Total Ingresado (${escapeXml(config.moneda_simbolo)})</Data></Cell>
    <Cell ss:StyleID="sColHeader"><Data ss:Type="String">Participación</Data></Cell>
   </Row>
   ${
     categoryData.length === 0
       ? `<Row><Cell ss:MergeAcross="3" ss:StyleID="sCenter"><Data ss:Type="String">No hay datos por categoría</Data></Cell></Row>`
       : categoryData
           .map((cat) => {
             const part = stats.totalVentas > 0 ? ((cat.total / stats.totalVentas) * 100).toFixed(1) : '0.0';
             return `
   <Row>
    <Cell ss:StyleID="sCellBold"><Data ss:Type="String">${escapeXml(cat.categoria)}</Data></Cell>
    <Cell ss:StyleID="sCenter"><Data ss:Type="Number">${cat.unidades}</Data></Cell>
    <Cell ss:StyleID="sCurrency"><Data ss:Type="Number">${cat.total}</Data></Cell>
    <Cell ss:StyleID="sCenter"><Data ss:Type="String">${part}%</Data></Cell>
   </Row>`;
           })
           .join('')
   }
   <Row ss:Height="14"></Row>

   <!-- 6. ESTADO DE CUENTAS POR COBRAR -->
   <Row ss:Height="24">
    <Cell ss:MergeAcross="4" ss:StyleID="sSectionTitle"><Data ss:Type="String">5. ESTADO DE CUENTAS POR COBRAR (CLIENTES CON DEUDA)</Data></Cell>
   </Row>
   <Row ss:Height="22">
    <Cell ss:StyleID="sColHeader"><Data ss:Type="String">Cliente</Data></Cell>
    <Cell ss:StyleID="sColHeader"><Data ss:Type="String">Teléfono</Data></Cell>
    <Cell ss:StyleID="sColHeader"><Data ss:Type="String">Límite de Crédito (${escapeXml(config.moneda_simbolo)})</Data></Cell>
    <Cell ss:StyleID="sColHeader"><Data ss:Type="String">Saldo Pendiente (${escapeXml(config.moneda_simbolo)})</Data></Cell>
    <Cell ss:StyleID="sColHeader"><Data ss:Type="String">Último Movimiento</Data></Cell>
   </Row>
   ${
     clientes.filter((c) => c.saldo_actual > 0).length === 0
       ? `<Row><Cell ss:MergeAcross="4" ss:StyleID="sCenter"><Data ss:Type="String">¡Excelente! No hay clientes con deuda pendiente</Data></Cell></Row>`
       : clientes
           .filter((c) => c.saldo_actual > 0)
           .sort((a, b) => b.saldo_actual - a.saldo_actual)
           .map(
             (c) => `
   <Row>
    <Cell ss:StyleID="sCellBold"><Data ss:Type="String">${escapeXml(c.nombre)}</Data></Cell>
    <Cell ss:StyleID="sCenter"><Data ss:Type="String">${escapeXml(c.telefono || 'Sin teléfono')}</Data></Cell>
    <Cell ss:StyleID="sCurrency"><Data ss:Type="Number">${c.limite_credito}</Data></Cell>
    <Cell ss:StyleID="sCurrencyAmber"><Data ss:Type="Number">${c.saldo_actual}</Data></Cell>
    <Cell ss:StyleID="sCenter"><Data ss:Type="String">${escapeXml(c.ultimo_movimiento || '-')}</Data></Cell>
   </Row>`
           )
           .join('')
   }
   <Row ss:Height="22">
    <Cell ss:MergeAcross="2" ss:StyleID="sTotalRow"><Data ss:Type="String">TOTAL CUENTAS POR COBRAR:</Data></Cell>
    <Cell ss:StyleID="sTotalCurrency"><Data ss:Type="Number">${stats.totalFiadosPendientes}</Data></Cell>
    <Cell ss:StyleID="sTotalRow"><Data ss:Type="String"></Data></Cell>
   </Row>
   <Row ss:Height="20"></Row>

   <!-- PIE DE REPORTE -->
   <Row>
    <Cell ss:MergeAcross="6" ss:StyleID="sFooter"><Data ss:Type="String">Reporte generado automáticamente por Sistema de Pulpería • Almacenamiento Local y Nube Firebase • ${escapeXml(config.nombre_negocio)}</Data></Cell>
   </Row>
  </Table>
 </Worksheet>
</Workbook>`;

  const blob = new Blob([xmlContent], {
    type: 'application/vnd.ms-excel;charset=utf-8'
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const safeNegocio = config.nombre_negocio.replace(/\s+/g, '_').toLowerCase();
  const safePeriod = periodLabel.replace(/\s+/g, '_').toLowerCase();
  const dateFormatted = now.toISOString().split('T')[0];

  anchor.href = url;
  anchor.download = `informe_financiero_${safeNegocio}_${safePeriod}_${dateFormatted}.xls`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Genera un archivo CSV estándar delimitado por punto y coma (para compatibilidad total con Excel en español)
 */
export function exportSalesToCSV(ventas: Venta[], config: ConfiguracionPulperia, periodLabel: string) {
  const headers = [
    'ID Venta',
    'Fecha y Hora',
    'Tipo de Venta',
    'Cliente',
    'Total (NIO)',
    'Ganancia Estimada (NIO)',
    'Pago Con (NIO)',
    'Vuelto (NIO)',
    'Detalle Articulos'
  ];

  const rows = ventas.map(v => {
    const itemsSummary = v.items.map(it => `${it.cantidad}x ${it.producto_nombre} (${config.moneda_simbolo}${it.subtotal.toFixed(2)})`).join(' | ');
    return [
      `"${v.id}"`,
      `"${v.fecha_hora}"`,
      `"${v.tipo === 'credito' ? 'Credito (Fiado)' : 'Contado (Efectivo)'}"`,
      `"${v.cliente_nombre || (v.tipo === 'credito' ? 'Cliente Fiador' : 'Cliente General')}"`,
      v.total.toFixed(2).replace('.', ','),
      (v.ganancia_estimada || 0).toFixed(2).replace('.', ','),
      (v.pago_con || v.total).toFixed(2).replace('.', ','),
      (v.vuelto || 0).toFixed(2).replace('.', ','),
      `"${itemsSummary.replace(/"/g, '""')}"`
    ].join(';');
  });

  const csvContent = '\ufeff' + [headers.join(';'), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateFormatted = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `ventas_${periodLabel}_${dateFormatted}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Genera un libro de Microsoft Excel (.xls / SpreadsheetML) con la lista completa del inventario actual,
 * resumen de valoración, cálculo de margen comercial y hoja especializada de Alertas y Reposición.
 * Diseñado con anchos de columna fijos, estilos limpios y compatibilidad total con Excel y LibreOffice Calc.
 */
export function exportInventoryToExcel(
  productos: Producto[],
  config: ConfiguracionPulperia,
  mode: 'todos' | 'alertas' = 'todos'
) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('es-NI', { year: 'numeric', month: '2-digit', day: '2-digit' });
  const timeStr = now.toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit' });

  // Cálculos globales
  const totalArticulos = productos.length;
  const totalUnidadesStock = productos.reduce((sum, p) => sum + (p.stock_actual || 0), 0);
  const valorTotalCosto = productos.reduce((sum, p) => sum + (p.stock_actual * p.precio_costo), 0);
  const valorTotalVenta = productos.reduce((sum, p) => sum + (p.stock_actual * p.precio_venta), 0);
  const gananciaPotencial = valorTotalVenta - valorTotalCosto;
  const margenPromedio = valorTotalCosto > 0 ? ((gananciaPotencial / valorTotalCosto) * 100).toFixed(1) : '0.0';

  const outOfStockList = productos.filter(p => p.stock_actual <= 0);
  const lowStockList = productos.filter(p => p.stock_actual > 0 && p.stock_actual <= p.stock_minimo);
  const allAlertsList = [...outOfStockList, ...lowStockList];

  const targetList = mode === 'alertas' ? allAlertsList : productos;

  const stylesXml = `
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Borders/>
   <Font ss:FontName="Segoe UI" x:Family="Swiss" ss:Size="10" ss:Color="#1E293B"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <!-- Titulo Principal Verde Pulpería -->
  <Style ss:ID="sHeaderTitle">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="14" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#065F46" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="sHeaderSubtitle">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Bold="1" ss:Color="#ECFDF5"/>
   <Interior ss:Color="#047857" ss:Pattern="Solid"/>
  </Style>
  <!-- Titulo de Sección -->
  <Style ss:ID="sSectionTitle">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center" ss:Indent="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#0F172A"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#0F172A" ss:Pattern="Solid"/>
  </Style>
  <!-- Encabezados de Columna -->
  <Style ss:ID="sColHeader">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#64748B"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#64748B"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#64748B"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#64748B"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#1E293B" ss:Pattern="Solid"/>
  </Style>
  <!-- Tarjetas KPI -->
  <Style ss:ID="sKpiTitle">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Bold="1" ss:Color="#475569"/>
   <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="sKpiValue">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="12" ss:Bold="1" ss:Color="#0F172A"/>
   <Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="sKpiValueEmerald">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="12" ss:Bold="1" ss:Color="#047857"/>
   <Interior ss:Color="#ECFDF5" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="sKpiValueDanger">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="12" ss:Bold="1" ss:Color="#BE123C"/>
   <Interior ss:Color="#FFF1F2" ss:Pattern="Solid"/>
  </Style>
  <!-- Celdas Normales y Alternadas -->
  <Style ss:ID="sCell">
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="10"/>
  </Style>
  <Style ss:ID="sCellAlt">
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="10"/>
   <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="sCellBold">
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1"/>
  </Style>
  <Style ss:ID="sCellBoldAlt">
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1"/>
   <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="sCenter">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="10"/>
  </Style>
  <Style ss:ID="sCenterAlt">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="10"/>
   <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="sNumber">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="10"/>
   <NumberFormat ss:Format="#,##0"/>
  </Style>
  <Style ss:ID="sNumberAlt">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="10"/>
   <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
   <NumberFormat ss:Format="#,##0"/>
  </Style>
  <Style ss:ID="sCurrency">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="10"/>
   <NumberFormat ss:Format="&quot;C$&quot;\ #,##0.00"/>
  </Style>
  <Style ss:ID="sCurrencyAlt">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="10"/>
   <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
   <NumberFormat ss:Format="&quot;C$&quot;\ #,##0.00"/>
  </Style>
  <Style ss:ID="sPercent">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="10"/>
   <NumberFormat ss:Format="0.0%"/>
  </Style>
  <Style ss:ID="sPercentAlt">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="10"/>
   <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
   <NumberFormat ss:Format="0.0%"/>
  </Style>
  <!-- Estados de Alerta con Color -->
  <Style ss:ID="sStatusNormal">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#A7F3D0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#A7F3D0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#A7F3D0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#A7F3D0"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Bold="1" ss:Color="#047857"/>
   <Interior ss:Color="#ECFDF5" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="sStatusWarning">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FDE68A"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FDE68A"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FDE68A"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FDE68A"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Bold="1" ss:Color="#B45309"/>
   <Interior ss:Color="#FFFBEB" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="sStatusDanger">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FECDD3"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FECDD3"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FECDD3"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FECDD3"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Bold="1" ss:Color="#BE123C"/>
   <Interior ss:Color="#FFF1F2" ss:Pattern="Solid"/>
  </Style>
  <!-- Totales -->
  <Style ss:ID="sTotalRow">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3" ss:Color="#0F172A"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#0F172A"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#0F172A"/>
   <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="sTotalNumber">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3" ss:Color="#0F172A"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#0F172A"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#0F172A"/>
   <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
   <NumberFormat ss:Format="#,##0"/>
  </Style>
  <Style ss:ID="sTotalCurrency">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3" ss:Color="#0F172A"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#0F172A"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#047857"/>
   <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
   <NumberFormat ss:Format="&quot;C$&quot;\ #,##0.00"/>
  </Style>
  <Style ss:ID="sFooter">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="8" ss:Italic="1" ss:Color="#64748B"/>
  </Style>`;

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Title>${escapeXml(config.nombre_negocio)} - Catálogo General de Inventario</Title>
  <Author>${escapeXml(config.nombre_negocio)}</Author>
  <Created>${now.toISOString()}</Created>
 </DocumentProperties>
 <Styles>
  ${stylesXml}
 </Styles>

 <!-- HOJA 1: INVENTARIO COMPLETO -->
 <Worksheet ss:Name="Inventario General">
  <Table ss:DefaultRowHeight="20">
   <Column ss:Index="1" ss:Width="38"/>
   <Column ss:Index="2" ss:Width="125"/>
   <Column ss:Index="3" ss:Width="250"/>
   <Column ss:Index="4" ss:Width="140"/>
   <Column ss:Index="5" ss:Width="110"/>
   <Column ss:Index="6" ss:Width="85"/>
   <Column ss:Index="7" ss:Width="85"/>
   <Column ss:Index="8" ss:Width="75"/>
   <Column ss:Index="9" ss:Width="155"/>
   <Column ss:Index="10" ss:Width="95"/>
   <Column ss:Index="11" ss:Width="115"/>
   <Column ss:Index="12" ss:Width="115"/>
   <Column ss:Index="13" ss:Width="85"/>
   <Column ss:Index="14" ss:Width="135"/>
   <Column ss:Index="15" ss:Width="135"/>
   <Column ss:Index="16" ss:Width="135"/>

   <!-- BANNER DE ENCABEZADO -->
   <Row ss:Height="32">
    <Cell ss:MergeAcross="15" ss:StyleID="sHeaderTitle"><Data ss:Type="String">${escapeXml(config.nombre_negocio.toUpperCase())} — CATÁLOGO GENERAL DE INVENTARIO</Data></Cell>
   </Row>
   <Row ss:Height="20">
    <Cell ss:MergeAcross="15" ss:StyleID="sHeaderSubtitle"><Data ss:Type="String">Reporte Oficial de Existencias, Costos y Valoración Comercial • Moneda: C$ (Córdobas NIO) • Emitido: ${dateStr} ${timeStr}</Data></Cell>
   </Row>
   <Row ss:Height="12"></Row>

   <!-- RESUMEN EJECUTIVO / TARJETAS KPI -->
   <Row ss:Height="20">
    <Cell ss:MergeAcross="3" ss:StyleID="sKpiTitle"><Data ss:Type="String">TOTAL PRODUCTOS REGISTRADOS</Data></Cell>
    <Cell ss:MergeAcross="3" ss:StyleID="sKpiTitle"><Data ss:Type="String">UNIDADES FÍSICAS EN STOCK</Data></Cell>
    <Cell ss:MergeAcross="3" ss:StyleID="sKpiTitle"><Data ss:Type="String">INVERSIÓN AL COSTO</Data></Cell>
    <Cell ss:MergeAcross="3" ss:StyleID="sKpiTitle"><Data ss:Type="String">VALORIZACIÓN PRECIO VENTA</Data></Cell>
   </Row>
   <Row ss:Height="26">
    <Cell ss:MergeAcross="3" ss:StyleID="sKpiValue"><Data ss:Type="Number">${totalArticulos}</Data></Cell>
    <Cell ss:MergeAcross="3" ss:StyleID="sKpiValue"><Data ss:Type="Number">${totalUnidadesStock}</Data></Cell>
    <Cell ss:MergeAcross="3" ss:StyleID="sKpiValue"><Data ss:Type="Number">${valorTotalCosto}</Data></Cell>
    <Cell ss:MergeAcross="3" ss:StyleID="sKpiValueEmerald"><Data ss:Type="Number">${valorTotalVenta}</Data></Cell>
   </Row>

   <Row ss:Height="20">
    <Cell ss:MergeAcross="3" ss:StyleID="sKpiTitle"><Data ss:Type="String">GANANCIA POTENCIAL TOTAL</Data></Cell>
    <Cell ss:MergeAcross="3" ss:StyleID="sKpiTitle"><Data ss:Type="String">MARGEN COMERCIAL ESTIMADO</Data></Cell>
    <Cell ss:MergeAcross="3" ss:StyleID="sKpiTitle"><Data ss:Type="String">PRODUCTOS CON ALERTA DE STOCK</Data></Cell>
    <Cell ss:MergeAcross="3" ss:StyleID="sKpiTitle"><Data ss:Type="String">ARTÍCULOS AGOTADOS (STOCK 0)</Data></Cell>
   </Row>
   <Row ss:Height="26">
    <Cell ss:MergeAcross="3" ss:StyleID="sKpiValueEmerald"><Data ss:Type="Number">${gananciaPotencial}</Data></Cell>
    <Cell ss:MergeAcross="3" ss:StyleID="sKpiValue"><Data ss:Type="String">${margenPromedio}%</Data></Cell>
    <Cell ss:MergeAcross="3" ss:StyleID="sKpiValue"><Data ss:Type="Number">${allAlertsList.length}</Data></Cell>
    <Cell ss:MergeAcross="3" ss:StyleID="sKpiValueDanger"><Data ss:Type="Number">${outOfStockList.length}</Data></Cell>
   </Row>
   <Row ss:Height="14"></Row>

   <!-- ENCABEZADOS DE TABLA -->
   <Row ss:Height="26">
    <Cell ss:StyleID="sColHeader"><Data ss:Type="String">#</Data></Cell>
    <Cell ss:StyleID="sColHeader"><Data ss:Type="String">Código / ID</Data></Cell>
    <Cell ss:StyleID="sColHeader"><Data ss:Type="String">Nombre del Producto</Data></Cell>
    <Cell ss:StyleID="sColHeader"><Data ss:Type="String">Categoría</Data></Cell>
    <Cell ss:StyleID="sColHeader"><Data ss:Type="String">Marca</Data></Cell>
    <Cell ss:StyleID="sColHeader"><Data ss:Type="String">Stock Actual</Data></Cell>
    <Cell ss:StyleID="sColHeader"><Data ss:Type="String">Stock Mínimo</Data></Cell>
    <Cell ss:StyleID="sColHeader"><Data ss:Type="String">Unidad</Data></Cell>
    <Cell ss:StyleID="sColHeader"><Data ss:Type="String">Estado de Stock</Data></Cell>
    <Cell ss:StyleID="sColHeader"><Data ss:Type="String">Sugerido Reponer</Data></Cell>
    <Cell ss:StyleID="sColHeader"><Data ss:Type="String">Costo Unit. (C$)</Data></Cell>
    <Cell ss:StyleID="sColHeader"><Data ss:Type="String">Venta Unit. (C$)</Data></Cell>
    <Cell ss:StyleID="sColHeader"><Data ss:Type="String">Margen</Data></Cell>
    <Cell ss:StyleID="sColHeader"><Data ss:Type="String">Inversión Costo (C$)</Data></Cell>
    <Cell ss:StyleID="sColHeader"><Data ss:Type="String">Valor Venta (C$)</Data></Cell>
    <Cell ss:StyleID="sColHeader"><Data ss:Type="String">Ganancia Proy. (C$)</Data></Cell>
   </Row>

   <!-- FILAS DE PRODUCTOS -->
   ${targetList.map((p, idx) => {
     const isAlt = idx % 2 === 1;
     const isOut = p.stock_actual <= 0;
     const isLow = p.stock_actual > 0 && p.stock_actual <= p.stock_minimo;
     
     const statusStyle = isOut ? 'sStatusDanger' : isLow ? 'sStatusWarning' : 'sStatusNormal';
     const statusLabel = isOut ? 'CRÍTICO: AGOTADO' : isLow ? 'ALERTA: STOCK BAJO' : 'NORMAL';

     const targetStock = Math.max(p.stock_minimo * 2, 10);
     const suggested = (p.stock_actual <= p.stock_minimo) ? Math.max(1, targetStock - p.stock_actual) : 0;

     const valCosto = p.stock_actual * p.precio_costo;
     const valVenta = p.stock_actual * p.precio_venta;
     const profit = valVenta - valCosto;
     const margin = p.precio_costo > 0 ? ((p.precio_venta - p.precio_costo) / p.precio_costo) : 0;

     const cCell = isAlt ? 'sCellAlt' : 'sCell';
     const cCenter = isAlt ? 'sCenterAlt' : 'sCenter';
     const cNum = isAlt ? 'sNumberAlt' : 'sNumber';
     const cCur = isAlt ? 'sCurrencyAlt' : 'sCurrency';
     const cPct = isAlt ? 'sPercentAlt' : 'sPercent';

     return `
   <Row>
    <Cell ss:StyleID="${cCenter}"><Data ss:Type="Number">${idx + 1}</Data></Cell>
    <Cell ss:StyleID="${cCenter}"><Data ss:Type="String">${escapeXml(p.codigo_barras || p.id)}</Data></Cell>
    <Cell ss:StyleID="${isAlt ? 'sCellBoldAlt' : 'sCellBold'}"><Data ss:Type="String">${escapeXml(p.nombre)}</Data></Cell>
    <Cell ss:StyleID="${cCell}"><Data ss:Type="String">${escapeXml(p.categoria || 'General')}</Data></Cell>
    <Cell ss:StyleID="${cCell}"><Data ss:Type="String">${escapeXml(p.marca || '-')}</Data></Cell>
    <Cell ss:StyleID="${cNum}"><Data ss:Type="Number">${p.stock_actual}</Data></Cell>
    <Cell ss:StyleID="${cNum}"><Data ss:Type="Number">${p.stock_minimo}</Data></Cell>
    <Cell ss:StyleID="${cCenter}"><Data ss:Type="String">${escapeXml(p.unidad_medida || 'unidad')}</Data></Cell>
    <Cell ss:StyleID="${statusStyle}"><Data ss:Type="String">${statusLabel}</Data></Cell>
    <Cell ss:StyleID="${cNum}"><Data ss:Type="Number">${suggested}</Data></Cell>
    <Cell ss:StyleID="${cCur}"><Data ss:Type="Number">${p.precio_costo}</Data></Cell>
    <Cell ss:StyleID="${cCur}"><Data ss:Type="Number">${p.precio_venta}</Data></Cell>
    <Cell ss:StyleID="${cPct}"><Data ss:Type="Number">${margin}</Data></Cell>
    <Cell ss:StyleID="${cCur}"><Data ss:Type="Number">${valCosto}</Data></Cell>
    <Cell ss:StyleID="${cCur}"><Data ss:Type="Number">${valVenta}</Data></Cell>
    <Cell ss:StyleID="${cCur}"><Data ss:Type="Number">${profit}</Data></Cell>
   </Row>`;
   }).join('')}

   <!-- FILA TOTALES -->
   <Row ss:Height="24">
    <Cell ss:MergeAcross="4" ss:StyleID="sTotalRow"><Data ss:Type="String">TOTALES GENERALES DEL INVENTARIO:</Data></Cell>
    <Cell ss:StyleID="sTotalNumber"><Data ss:Type="Number">${totalUnidadesStock}</Data></Cell>
    <Cell ss:MergeAcross="6" ss:StyleID="sTotalRow"><Data ss:Type="String"></Data></Cell>
    <Cell ss:StyleID="sTotalCurrency"><Data ss:Type="Number">${valorTotalCosto}</Data></Cell>
    <Cell ss:StyleID="sTotalCurrency"><Data ss:Type="Number">${valorTotalVenta}</Data></Cell>
    <Cell ss:StyleID="sTotalCurrency"><Data ss:Type="Number">${gananciaPotencial}</Data></Cell>
   </Row>
   <Row ss:Height="18"></Row>
   <Row>
    <Cell ss:MergeAcross="15" ss:StyleID="sFooter"><Data ss:Type="String">Documento generado desde el Sistema de Gestión de Pulpería • Almacenamiento Seguro Local y Nube Firebase</Data></Cell>
   </Row>
  </Table>
 </Worksheet>

 <!-- HOJA 2: ALERTAS Y REPOSICIÓN -->
 <Worksheet ss:Name="Alertas y Reposición">
  <Table ss:DefaultRowHeight="20">
   <Column ss:Index="1" ss:Width="38"/>
   <Column ss:Index="2" ss:Width="125"/>
   <Column ss:Index="3" ss:Width="250"/>
   <Column ss:Index="4" ss:Width="140"/>
   <Column ss:Index="5" ss:Width="85"/>
   <Column ss:Index="6" ss:Width="85"/>
   <Column ss:Index="7" ss:Width="80"/>
   <Column ss:Index="8" ss:Width="150"/>
   <Column ss:Index="9" ss:Width="110"/>
   <Column ss:Index="10" ss:Width="110"/>
   <Column ss:Index="11" ss:Width="130"/>

   <Row ss:Height="30">
    <Cell ss:MergeAcross="10" ss:StyleID="sHeaderTitle"><Data ss:Type="String">${escapeXml(config.nombre_negocio.toUpperCase())} — LISTA DE REPOSICIÓN DE STOCK</Data></Cell>
   </Row>
   <Row ss:Height="18">
    <Cell ss:MergeAcross="10" ss:StyleID="sHeaderSubtitle"><Data ss:Type="String">Productos que requieren pedido inmediato (Agotados y con Stock Crítico) • ${allAlertsList.length} artículos en alerta</Data></Cell>
   </Row>
   <Row ss:Height="12"></Row>

   <Row ss:Height="24">
    <Cell ss:StyleID="sColHeader"><Data ss:Type="String">#</Data></Cell>
    <Cell ss:StyleID="sColHeader"><Data ss:Type="String">Código / Barra</Data></Cell>
    <Cell ss:StyleID="sColHeader"><Data ss:Type="String">Producto Requerido</Data></Cell>
    <Cell ss:StyleID="sColHeader"><Data ss:Type="String">Categoría</Data></Cell>
    <Cell ss:StyleID="sColHeader"><Data ss:Type="String">Stock Actual</Data></Cell>
    <Cell ss:StyleID="sColHeader"><Data ss:Type="String">Stock Mínimo</Data></Cell>
    <Cell ss:StyleID="sColHeader"><Data ss:Type="String">Unidad</Data></Cell>
    <Cell ss:StyleID="sColHeader"><Data ss:Type="String">Nivel de Urgencia</Data></Cell>
    <Cell ss:StyleID="sColHeader"><Data ss:Type="String">Sugerido Comprar</Data></Cell>
    <Cell ss:StyleID="sColHeader"><Data ss:Type="String">Costo Unit. (C$)</Data></Cell>
    <Cell ss:StyleID="sColHeader"><Data ss:Type="String">Presupuesto Compra (C$)</Data></Cell>
   </Row>

   ${
     allAlertsList.length === 0
       ? `<Row><Cell ss:MergeAcross="10" ss:StyleID="sCenter"><Data ss:Type="String">¡Excelente! No hay productos con alertas de stock en este momento.</Data></Cell></Row>`
       : allAlertsList.map((p, idx) => {
           const isAlt = idx % 2 === 1;
           const isOut = p.stock_actual <= 0;
           const targetStock = Math.max(p.stock_minimo * 2, 10);
           const unitsToBuy = Math.max(1, targetStock - p.stock_actual);
           const estCost = unitsToBuy * p.precio_costo;

           const statusStyle = isOut ? 'sStatusDanger' : 'sStatusWarning';
           const statusLabel = isOut ? 'AGOTADO' : 'POR AGOTARSE';

           const cCell = isAlt ? 'sCellAlt' : 'sCell';
           const cCenter = isAlt ? 'sCenterAlt' : 'sCenter';
           const cNum = isAlt ? 'sNumberAlt' : 'sNumber';
           const cCur = isAlt ? 'sCurrencyAlt' : 'sCurrency';

           return `
   <Row>
    <Cell ss:StyleID="${cCenter}"><Data ss:Type="Number">${idx + 1}</Data></Cell>
    <Cell ss:StyleID="${cCenter}"><Data ss:Type="String">${escapeXml(p.codigo_barras || p.id)}</Data></Cell>
    <Cell ss:StyleID="${isAlt ? 'sCellBoldAlt' : 'sCellBold'}"><Data ss:Type="String">${escapeXml(p.nombre)}</Data></Cell>
    <Cell ss:StyleID="${cCell}"><Data ss:Type="String">${escapeXml(p.categoria || 'General')}</Data></Cell>
    <Cell ss:StyleID="${cNum}"><Data ss:Type="Number">${p.stock_actual}</Data></Cell>
    <Cell ss:StyleID="${cNum}"><Data ss:Type="Number">${p.stock_minimo}</Data></Cell>
    <Cell ss:StyleID="${cCenter}"><Data ss:Type="String">${escapeXml(p.unidad_medida || 'unidad')}</Data></Cell>
    <Cell ss:StyleID="${statusStyle}"><Data ss:Type="String">${statusLabel}</Data></Cell>
    <Cell ss:StyleID="${cNum}"><Data ss:Type="Number">${unitsToBuy}</Data></Cell>
    <Cell ss:StyleID="${cCur}"><Data ss:Type="Number">${p.precio_costo}</Data></Cell>
    <Cell ss:StyleID="${cCur}"><Data ss:Type="Number">${estCost}</Data></Cell>
   </Row>`;
         }).join('')
   }

   <Row ss:Height="24">
    <Cell ss:MergeAcross="7" ss:StyleID="sTotalRow"><Data ss:Type="String">PRESUPUESTO TOTAL ESTIMADO PARA REPOSICIÓN:</Data></Cell>
    <Cell ss:StyleID="sTotalNumber"><Data ss:Type="Number">${allAlertsList.reduce((acc, p) => {
      const target = Math.max(p.stock_minimo * 2, 10);
      return acc + Math.max(1, target - p.stock_actual);
    }, 0)}</Data></Cell>
    <Cell ss:StyleID="sTotalRow"><Data ss:Type="String"></Data></Cell>
    <Cell ss:StyleID="sTotalCurrency"><Data ss:Type="Number">${allAlertsList.reduce((acc, p) => {
      const target = Math.max(p.stock_minimo * 2, 10);
      const units = Math.max(1, target - p.stock_actual);
      return acc + (units * p.precio_costo);
    }, 0)}</Data></Cell>
   </Row>
  </Table>
 </Worksheet>
</Workbook>`;

  const blob = new Blob([xmlContent], {
    type: 'application/vnd.ms-excel;charset=utf-8'
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeNegocio = config.nombre_negocio.replace(/\s+/g, '_').toLowerCase();
  const fileSuffix = mode === 'alertas' ? 'alertas_stock' : 'inventario_completo';
  const dateFormatted = now.toISOString().split('T')[0];

  a.href = url;
  a.download = `${safeNegocio}_${fileSuffix}_${dateFormatted}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Genera un archivo CSV descargable con la lista completa del inventario actual y las alertas de stock
 * Compatible directamente con Microsoft Excel, LibreOffice Calc y Google Sheets (UTF-8 con BOM y delimitador ;)
 */
export function exportInventoryAndAlertsToCSV(
  productos: Producto[],
  config: ConfiguracionPulperia,
  mode: 'todos' | 'alertas' = 'todos'
) {
  const targetProducts = mode === 'alertas'
    ? productos.filter(p => p.stock_actual <= p.stock_minimo)
    : productos;

  const headers = [
    'Código de Barras / ID',
    'Nombre del Producto',
    'Categoría',
    'Marca',
    'Stock Actual',
    'Stock Mínimo',
    'Unidad de Medida',
    'Nivel / Alerta de Stock',
    'Unidades a Reponer (Sugeridas)',
    'Precio Costo (NIO)',
    'Precio Venta (NIO)',
    'Margen Ganancia (%)',
    'Valor Total Costo (NIO)',
    'Valor Total Venta (NIO)',
    'Ganancia Proyectada (NIO)',
    'Costo Estimado Reposición (NIO)'
  ];

  const rows = targetProducts.map(p => {
    const isOutOfStock = p.stock_actual <= 0;
    const isLowStock = p.stock_actual > 0 && p.stock_actual <= p.stock_minimo;
    const alertLevel = isOutOfStock
      ? 'CRÍTICO: AGOTADO'
      : isLowStock
        ? 'ALERTA: STOCK BAJO'
        : 'NORMAL: EXISTENCIA ADECUADA';

    const targetStock = Math.max(p.stock_minimo * 2, 10);
    const unitsToReplenish = (p.stock_actual <= p.stock_minimo)
      ? Math.max(1, targetStock - p.stock_actual)
      : 0;

    const marginPercent = p.precio_costo > 0
      ? (((p.precio_venta - p.precio_costo) / p.precio_costo) * 100).toFixed(1)
      : '0.0';

    const totalValCost = p.stock_actual * p.precio_costo;
    const totalValSale = p.stock_actual * p.precio_venta;
    const projectedProfit = totalValSale - totalValCost;
    const estimatedReplenishmentCost = unitsToReplenish * p.precio_costo;

    return [
      `"${p.codigo_barras || p.id}"`,
      `"${p.nombre.replace(/"/g, '""')}"`,
      `"${(p.categoria || 'Sin Categoría').replace(/"/g, '""')}"`,
      `"${(p.marca || '-').replace(/"/g, '""')}"`,
      p.stock_actual.toString().replace('.', ','),
      p.stock_minimo.toString().replace('.', ','),
      `"${p.unidad_medida || 'unidad'}"`,
      `"${alertLevel}"`,
      unitsToReplenish.toString().replace('.', ','),
      p.precio_costo.toFixed(2).replace('.', ','),
      p.precio_venta.toFixed(2).replace('.', ','),
      marginPercent.replace('.', ','),
      totalValCost.toFixed(2).replace('.', ','),
      totalValSale.toFixed(2).replace('.', ','),
      projectedProfit.toFixed(2).replace('.', ','),
      estimatedReplenishmentCost.toFixed(2).replace('.', ',')
    ].join(';');
  });

  const csvContent = '\ufeff' + [headers.join(';'), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateFormatted = new Date().toISOString().split('T')[0];
  const safeNegocio = config.nombre_negocio.replace(/\s+/g, '_').toLowerCase();
  const fileSuffix = mode === 'alertas' ? 'alertas_stock' : 'inventario_completo';
  a.href = url;
  a.download = `${safeNegocio}_${fileSuffix}_${dateFormatted}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
