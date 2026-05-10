/**
 * LayoutRenderer Component
 * Renders test parameters based on a TestLayout template
 * Supports: grouped, flat, hybrid, and custom layouts
 */

import React, { useMemo } from 'react';
import type { TestLayout, LayoutColumn } from '../../../types/reportLayout';

interface Parameter {
  name: string;
  result: string;
  unit: string;
  refRange: string;
  status?: string;
  fieldType?: string;
  group?: string;
}

interface LayoutRendererProps {
  layout: TestLayout;
  parameters: Parameter[];
  colorTokens: Record<string, string>;
}

const getPaddingByRowHeight = (rowHeight?: string): number => {
  switch (rowHeight) {
    case 'compact':
      return 2;
    case 'spacious':
      return 6;
    default:
      return 3;
  }
};

const getRowBgColor = (
  index: number,
  isAbnormal: boolean,
  status: string | undefined,
  colors: Record<string, string>
): string => {
  if (!isAbnormal) {
    return index % 2 === 0 ? colors.white || '#FFFFFF' : colors.tableStripe || '#F1F4F8';
  }
  if (status === 'high') {
    return 'rgba(198,40,40,0.04)';
  }
  if (status === 'low') {
    return 'rgba(21,101,192,0.04)';
  }
  return colors.white || '#FFFFFF';
};

const getStatusLabel = (status?: string): string => {
  if (status === 'high') return 'High';
  if (status === 'low') return 'Low';
  if (status === 'borderline') return 'Borderline';
  return '';
};

/**
 * Render a flat (single-table) layout
 */
function FlatLayout({ layout, parameters, colorTokens }: LayoutRendererProps) {
  const padding = getPaddingByRowHeight(layout.style.rowHeight);
  const fontSize = layout.style.fontSize || 10.5;

  return (
    <table style={{
      width: '100%',
      borderCollapse: 'collapse',
      tableLayout: 'auto',
      fontSize: `${fontSize}px`,
    }}>
      <thead>
        <tr style={{ background: colorTokens.brand }}>
          {layout.columns.filter((c) => c.show !== false).map((col) => (
            <th
              key={col.name}
              style={{
                textAlign: col.align || 'center',
                padding: `${padding}px 8px`,
                fontWeight: layout.style.headerBold ? 700 : 600,
                color: colorTokens.white,
                fontSize: `${(fontSize * 0.95)}px`,
                letterSpacing: '0.3px',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                width: col.width,
              }}
            >
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {parameters.map((param, idx) => {
          const isAbnormal = param.status === 'low' || param.status === 'high';
          const statusColor = param.status === 'high' 
            ? colorTokens.high 
            : param.status === 'low' 
            ? colorTokens.low 
            : colorTokens.text;
          const statusLabel = getStatusLabel(param.status);
          const rowBg = getRowBgColor(idx, isAbnormal, param.status, colorTokens);

          return (
            <tr key={idx} style={{ background: rowBg }}>
              {layout.columns.filter((c) => c.show !== false).map((col) => {
                let cellContent = '';
                switch (col.name) {
                  case 'investigation':
                    cellContent = param.name;
                    break;
                  case 'result':
                    cellContent = param.result;
                    break;
                  case 'status':
                    cellContent = statusLabel;
                    break;
                  case 'refRange':
                    cellContent = param.refRange;
                    break;
                  case 'unit':
                    cellContent = param.unit;
                    break;
                  default:
                    cellContent = '';
                }

                const textAlign = col.align || 'center';
                const isCellBold = col.bold || (col.name === 'investigation' && layout.style.headerBold);

                return (
                  <td
                    key={col.name}
                    style={{
                      padding: `${padding}px 8px`,
                      textAlign: textAlign as any,
                      fontWeight: isCellBold || (isAbnormal && col.name === 'result') ? 700 : 500,
                      color: col.name === 'result' ? statusColor : colorTokens.secondary,
                      borderBottom: `1px solid ${colorTokens.borderLight}`,
                      fontSize: col.fontSize ? `${col.fontSize}px` : undefined,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {cellContent}
                  </td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/**
 * Render a grouped layout (with section headers)
 */
function GroupedLayout({ layout, parameters, colorTokens }: LayoutRendererProps) {
  const padding = getPaddingByRowHeight(layout.style.rowHeight);
  const fontSize = layout.style.fontSize || 10.5;

  return (
    <table style={{
      width: '100%',
      borderCollapse: 'collapse',
      tableLayout: 'auto',
      fontSize: `${fontSize}px`,
    }}>
      <thead>
        <tr style={{ background: colorTokens.brand }}>
          {layout.columns.filter((c) => c.show !== false).map((col) => (
            <th
              key={col.name}
              style={{
                textAlign: col.align || 'center',
                padding: `${padding}px 8px`,
                fontWeight: layout.style.headerBold ? 700 : 600,
                color: colorTokens.white,
                fontSize: `${fontSize * 0.95}px`,
                letterSpacing: '0.3px',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                width: col.width,
              }}
            >
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {(() => {
          let lastGroup: string | undefined;
          let rowIndex = 0;

          return parameters.map((param, idx) => {
            const isAbnormal = param.status === 'low' || param.status === 'high';
            const statusColor = param.status === 'high'
              ? colorTokens.high
              : param.status === 'low'
              ? colorTokens.low
              : colorTokens.text;
            const statusLabel = getStatusLabel(param.status);
            const rowBg = getRowBgColor(rowIndex, isAbnormal, param.status, colorTokens);

            const showGroupHeader = param.group && param.group !== lastGroup;
            if (param.group) lastGroup = param.group;

            rowIndex++;

            return (
              <React.Fragment key={idx}>
                {showGroupHeader && (
                  <tr style={{ background: colorTokens.brandLight }}>
                    <td
                      colSpan={layout.columns.length}
                      style={{
                        padding: `${padding}px 8px`,
                        fontWeight: layout.style.groupBold ? 800 : 700,
                        fontSize: `${fontSize * 0.9}px`,
                        color: colorTokens.brand,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        borderBottom: `1px solid ${colorTokens.borderLight}`,
                      }}
                    >
                      {param.group}
                    </td>
                  </tr>
                )}
                <tr style={{ background: rowBg }}>
                  {layout.columns.filter((c) => c.show !== false).map((col) => {
                    let cellContent = '';
                    switch (col.name) {
                      case 'investigation':
                        cellContent = param.name;
                        break;
                      case 'result':
                        cellContent = param.result;
                        break;
                      case 'status':
                        cellContent = statusLabel;
                        break;
                      case 'refRange':
                        cellContent = param.refRange;
                        break;
                      case 'unit':
                        cellContent = param.unit;
                        break;
                      default:
                        cellContent = '';
                    }

                    const textAlign = col.align || 'center';
                    const isCellBold = col.bold || (col.name === 'investigation' && layout.style.headerBold);

                    return (
                      <td
                        key={col.name}
                        style={{
                          padding: `${padding}px 8px`,
                          textAlign: textAlign as any,
                          fontWeight: isCellBold || (isAbnormal && col.name === 'result') ? 700 : 500,
                          color: col.name === 'result' ? statusColor : colorTokens.secondary,
                          borderBottom: `1px solid ${colorTokens.borderLight}`,
                          fontSize: col.fontSize ? `${col.fontSize}px` : undefined,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {cellContent}
                      </td>
                    );
                  })}
                </tr>
              </React.Fragment>
            );
          });
        })()}
      </tbody>
    </table>
  );
}

/**
 * Main LayoutRenderer Component
 */
export function LayoutRenderer({ layout, parameters, colorTokens }: LayoutRendererProps) {
  const renderLayout = useMemo(() => {
    switch (layout.layoutType) {
      case 'grouped':
        return <GroupedLayout layout={layout} parameters={parameters} colorTokens={colorTokens} />;
      case 'flat':
        return <FlatLayout layout={layout} parameters={parameters} colorTokens={colorTokens} />;
      case 'hybrid':
        // For hybrid, render as grouped by default (can be enhanced later)
        return <GroupedLayout layout={layout} parameters={parameters} colorTokens={colorTokens} />;
      default:
        // Custom layout type - render as grouped
        return <GroupedLayout layout={layout} parameters={parameters} colorTokens={colorTokens} />;
    }
  }, [layout, parameters, colorTokens]);

  return <>{renderLayout}</>;
}

export default LayoutRenderer;
