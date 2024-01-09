import { allStudents } from "~/pages/attendance";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";

const JoiningStudents = ({
  joiningStudentArray,
}: {
  joiningStudentArray: string[];
}) => {
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="students">
        <AccordionTrigger>Bu derse katılan Öğrenciler</AccordionTrigger>
        <AccordionContent>
          <div className="grid grid-cols-2 gap-2">
            {joiningStudentArray.map((studentNo) => {
              console.log(studentNo);

              const studentName = allStudents.find((a) => {
                return a.no === studentNo;
              })?.name;
              return <li key={studentNo}>{studentName}</li>;
            })}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default JoiningStudents;
