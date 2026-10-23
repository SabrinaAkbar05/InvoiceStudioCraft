import React from 'react';
import { Invoice } from '@/types/invoice';
import { Workspace } from '@/types/workspace';
import { TemplateMinimal } from './TemplateMinimal';
import { TemplateCorporate } from './TemplateCorporate';
import { TemplateElegant } from './TemplateElegant';
import { TemplateCreative } from './TemplateCreative';

interface RendererProps {
  invoice: Invoice;
  workspace?: Workspace | null;
  targetId?: string;
}

export const InvoiceTemplateRenderer: React.FC<RendererProps> = ({
  invoice,
  workspace,
  targetId = 'invoice-render-target'
}) => {
  const templateId = invoice.brandKitSnapshot.templateId || 'corporate';

  switch (templateId) {
    case 'minimal':
      return <TemplateMinimal invoice={invoice} workspace={workspace} id={targetId} />;
    case 'elegant':
      return <TemplateElegant invoice={invoice} workspace={workspace} id={targetId} />;
    case 'creative':
      return <TemplateCreative invoice={invoice} workspace={workspace} id={targetId} />;
    case 'corporate':
    default:
      return <TemplateCorporate invoice={invoice} workspace={workspace} id={targetId} />;
  }
};
