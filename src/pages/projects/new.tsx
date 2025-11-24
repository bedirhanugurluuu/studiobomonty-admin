import { useEffect } from "react";
import { useBreadcrumb } from "../../contexts/BreadcrumbContext";
import ProjectForm from "../../components/projects/ProjectForm";

export default function ProjectsNewPage() {
  const { setBreadcrumbs } = useBreadcrumb();

  useEffect(() => {
    setBreadcrumbs([
      { name: "Dashboard", to: "/admin/dashboard" },
      { name: "Projects", to: "/admin/projects" },
      { name: "New Project" }
    ]);
  }, [setBreadcrumbs]);

  return <ProjectForm mode="new" />;
}
