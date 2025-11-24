import { Link } from 'react-router-dom';
import Swal from "sweetalert2";
import { Project } from "../../types/Project";
import { getImageUrl, getFallbackImageUrl } from "../../utils/imageUtils";
import { api } from "../../utils/api";
import { useState, useEffect } from "react";

interface Props {
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
}

const ProjectList = ({ projects, setProjects }: Props) => {
  const [orderValues, setOrderValues] = useState<Record<string, number>>({});
  const [updatingOrders, setUpdatingOrders] = useState<Set<string>>(new Set());

  // Initialize order values from projects
  useEffect(() => {
    const initialValues: Record<string, number> = {};
    projects.forEach((project) => {
      initialValues[project.id] = project.display_order ?? 0;
    });
    setOrderValues(initialValues);
  }, [projects]);

  if (projects.length === 0) return <p>Proje bulunamadı.</p>;

  const handleOrderChange = async (projectId: string, newOrder: number) => {
    const orderNum = Number(newOrder);
    if (isNaN(orderNum)) return;

    // Update local state immediately
    setOrderValues((prev) => ({ ...prev, [projectId]: orderNum }));
    setUpdatingOrders((prev) => new Set(prev).add(projectId));

    try {
      const { error } = await api.projects.update(projectId, { display_order: orderNum });
      
      if (error) {
        throw error;
      }

      // Update projects list
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, display_order: orderNum } : p))
      );

      Swal.fire({
        icon: "success",
        title: "Sıralama güncellendi!",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("Order update error:", err);
      Swal.fire({
        icon: "error",
        title: "Sıralama güncellenemedi!",
        text: (err as Error).message || "",
      });
      // Revert local state on error
      const project = projects.find((p) => p.id === projectId);
      if (project) {
        setOrderValues((prev) => ({ ...prev, [projectId]: project.display_order ?? 0 }));
      }
    } finally {
      setUpdatingOrders((prev) => {
        const newSet = new Set(prev);
        newSet.delete(projectId);
        return newSet;
      });
    }
  };

  const handleDelete = async (project: Project) => {
    const result = await Swal.fire({
      title: "Bu projeyi silmek istediğinize emin misiniz?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Evet, sil",
      cancelButtonText: "İptal",
    });

    if (!result.isConfirmed) return;

    try {
      const { error } = await api.projects.delete(project);
      if (error) {
        throw error;
      }
      Swal.fire({
        icon: "success",
        title: "Silindi!",
        timer: 1500,
        showConfirmButton: false,
      });
      setProjects((prev) => prev.filter((p) => p.id !== project.id));
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Silme işlemi başarısız!",
        text: (err as Error).message || "",
      });
    }
  };

  // Sort projects by display_order
  const sortedProjects = [...projects].sort((a, b) => {
    const orderA = a.display_order ?? 999999;
    const orderB = b.display_order ?? 999999;
    return orderA - orderB;
  });

  return (
    <table className="table w-full">
      <thead>
        <tr>
          <th>Banner</th>
          <th>Başlık</th>
          <th>Order</th>
          <th>İşlemler</th>
        </tr>
      </thead>
      <tbody>
        {sortedProjects.map((project) => {
          const isVideoBanner = /\.(mp4|webm|ogg|mov)$/i.test(project.banner_media || '');
          const isUpdating = updatingOrders.has(project.id);
          const currentOrder = orderValues[project.id] ?? project.display_order ?? 0;
          
          return (
            <tr key={project.id} className="hover">
              <td>
                {project.banner_media ? (
                  isVideoBanner ? (
                    <div className="w-20 h-12 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                      🎥 Video
                    </div>
                  ) : (
                    <img
                      src={getImageUrl(project.banner_media)}
                      alt={project.title}
                      className="w-20 h-12 object-cover rounded"
                      onError={(e) => {
                        e.currentTarget.src = getFallbackImageUrl();
                      }}
                    />
                  )
                ) : (
                  <div className="w-20 h-12 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                    No Image
                  </div>
                )}
              </td>
              <td>{project.title}</td>
              <td>
                <input
                  type="number"
                  value={currentOrder}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setOrderValues((prev) => ({ ...prev, [project.id]: Number(newValue) || 0 }));
                  }}
                  onBlur={(e) => {
                    const newOrder = Number(e.target.value);
                    if (newOrder !== (project.display_order ?? 0)) {
                      handleOrderChange(project.id, newOrder);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.currentTarget.blur();
                    }
                  }}
                  className="input input-bordered input-sm w-20"
                  disabled={isUpdating}
                  min="0"
                />
                {isUpdating && (
                  <span className="loading loading-spinner loading-xs ml-2"></span>
                )}
              </td>
              <td>
                <Link to={`/admin/projects/edit/${project.id}`} className="btn btn-sm btn-info mr-2">
                  Düzenle
                </Link>
                <button
                  onClick={() => handleDelete(project)}
                  className="btn btn-sm btn-error"
                >
                  Sil
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default ProjectList;
