import { PortalLayout } from "@/modules/generic/views/PortalLayout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <PortalLayout>{children}</PortalLayout>;
}
