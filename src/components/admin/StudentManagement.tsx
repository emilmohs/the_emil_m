import { getStudentsByClass } from "@/app/actions/students";
import StudentAccordion from "./StudentAccordion";
import StudentForms from "./StudentForms";

export default async function StudentManagement({ allClasses, allTags = [] }: { allClasses: {id: string}[], allTags?: any[] }) {
  const classData = await Promise.all(
    allClasses.map(async (c) => ({
      id: c.id,
      students: await getStudentsByClass(c.id)
    }))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-6 px-2">
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Klassen & Schüler Übersicht</h2>
      </div>
      
      <StudentForms allClasses={allClasses} />
      
      <StudentAccordion classes={classData} allTags={allTags} allClasses={allClasses} />
    </div>
  );
}
