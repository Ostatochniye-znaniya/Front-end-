import { adminRequest } from './adminRequest';

export interface SettingsValues {
  supportEmail: string | null;
  supportPhone: string | null;
  welcomeText: string | null;
  accessRequestInstructions: string | null;
  notificationTemplate: string | null;
}
export interface SystemSettings extends SettingsValues {
  updatedAt: string | null;
  updatedBy: string | null;
}
export const getAdminSettings = (signal?: AbortSignal) => adminRequest<SystemSettings>('/settings', { signal });
export const updateAdminSettings = (values: SettingsValues) => adminRequest<SystemSettings>('/settings', {
  method: 'PUT',
  body: JSON.stringify({
    supportEmail: values.supportEmail,
    supportPhone: values.supportPhone,
    welcomeText: values.welcomeText,
    accessRequestInstructions: values.accessRequestInstructions,
    notificationTemplate: values.notificationTemplate,
  }),
});
