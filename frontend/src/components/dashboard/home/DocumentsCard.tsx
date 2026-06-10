import { useRef, useState } from "react";
import { FileText, Upload, X, FileCode } from "lucide-react";
import { motion } from "framer-motion";

type DocumentsCardProps = {
  objective: File[] | null;
  setObjective: React.Dispatch<React.SetStateAction<File[] | null>>;
};

const DocumentsCard = ({ objective, setObjective }: DocumentsCardProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClickClickToUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      Array.from(e.target.files).forEach(processFile);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files).forEach(processFile);
    }
  };

  const processFile = (selectedFile: File) => {
    setObjective((prev: File[] | null) => {
      if (prev === null) {
        return [selectedFile];
      }

      return [...prev, selectedFile];
    });
  };

  const handleDelete = (index: number) => {
    setObjective((prev: File[] | null) => {
      if (prev === null) {
        return null;
      }

      const updatedFiles = prev.filter((_, i) => i !== index);

      return updatedFiles.length > 0 ? updatedFiles : null;
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-[#191c1f] rounded-3xl p-8 shadow-[0_0_40px_0_rgba(206,189,255,0.05)] border border-[#494454]/5 flex flex-col h-full"
    >
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-[#cebdff]/10 rounded-lg">
          <FileText size={20} className="text-[#cebdff]" />
        </div>
        <h3 className="text-xl font-bold tracking-tight text-white">문서</h3>
      </div>

      <div className="flex-1 flex flex-col">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept=".pdf,.doc,.docx"
          multiple
        />

        <motion.div
          onClick={handleClickClickToUpload}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          whileHover={{ backgroundColor: "rgba(50, 53, 57, 0.2)" }}
          className={`mt-2 border-2 border-dashed rounded-3xl p-4 flex flex-col items-center justify-center text-center transition-all cursor-pointer group ${
            isDragging
              ? "border-[#cebdff] bg-[#cebdff]/5"
              : "border-[#494454]/20"
          }`}
        >
          <div className="w-16 h-16 rounded-full bg-[#cebdff]/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500 pointer-events-none">
            <Upload size={28} className="text-[#cebdff]" />
          </div>
          <p className="text-[#e1e2e7] font-bold mb-1 pointer-events-none text-sm">
            여기에 파일을 드롭하거나 클릭하여 업로드하세요
          </p>
          <p className="text-[#cbc3d7]/60 text-xs font-medium max-w-[200px] pointer-events-none">
            이력서를 업로드하세요 (PDF, DOCX)
          </p>
        </motion.div>

        {objective !== null && objective?.length > 0 && (
          <div className="space-y-4">
            <p className="text-xs tracking-widest text-[#cbc3d7]/70 font-bold mt-4">
              업로드된 파일
            </p>

            {objective?.map((file, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-4 bg-[#0c0e12] rounded-2xl border border-[#494454]/10 group hover:border-[#cebdff]/20 transition-colors"
              >
                <div className="flex items-center gap-4 overflow-hidden">
                  <div className="p-2.5 bg-[#7bd0ff]/10 rounded-xl shrink-0">
                    <FileCode size={20} className="text-[#7bd0ff]" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-bold text-[#e1e2e7] truncate w-40 sm:w-48">
                      {file.name}
                    </p>
                    <p className="text-xs font-medium text-[#cbc3d7]/60 mt-1">
                      {file.size} • {file.lastModified}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(index)}
                  className="text-[#cbc3d7]/30 hover:text-red-400 transition-colors p-1 shrink-0 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default DocumentsCard;
