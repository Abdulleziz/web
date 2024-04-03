import { type NextPage } from "next";
import { useMemo, useState } from "react";
import { Layout } from "~/components/Layout";
import { useHydrated } from "../_app";
import { Button } from "~/components/ui/button";
import { QrCodeIcon } from "lucide-react";
import { QrScanner } from "@yudiel/react-qr-scanner";
import useDevice from "~/hooks/useDevice";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import toast from "react-hot-toast";
import { Select, SelectValue } from "@radix-ui/react-select";
import {
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "~/components/ui/select";
import { useQueries, useQuery } from "@tanstack/react-query";
import JoiningStudents from "~/components/attendanceComponents/JoiningStudents";
import { api } from "~/utils/api";

export type getQrLessonsResponse = {
  lessonName: string;
  lessonId: string;
  lessonCode: string;
};

type joinLectureResponse = {
  header: string;
  paragraph: string;
};

export const allStudents = [
  { name: "Barkin", no: "20212022067" },
  { name: "İlker", no: "20212022092" },
  { name: "Ali Kerem Karaduman", no: "20212022072" },
  { name: "Kaan", no: "20212022089" },
  { name: "Yağiz", no: "20212022021" },
  { name: "Yusuf", no: "20212022071" },
  { name: "Bora", no: "20202022025" },
  { name: "Buğra", no: "20202022035" },
  { name: "Ulaştı", no: "20232022062" },
  { name: "Taha", no: "20202022008" },
];
const studentNumbers = allStudents.map((student) => student.no);
const Attendance: NextPage = () => {
  const [qrLink, setQrLink] = useState<string>("");
  const [activationCode, setActivationCode] = useState<string>("");
  const [selectedLessonId, setSelectedLessonId] = useState<string>();

  const hydrated = useHydrated();
  const { isMobile } = useDevice();
  const lecturePostJoin = api.notifications.lecturePostJoin.useMutation();
  const { data: activationCodeData } = useQuery({
    queryKey: ["activationCode", activationCode],
    enabled: activationCode?.length === 7,
    queryFn: () => fetchActivationCode(activationCode),
  });
  const { data: qrLinkData } = useQuery({
    queryKey: ["QrCode", qrLink],
    enabled: qrLink?.startsWith("https://pdks.nisantasi.edu.tr/ogrenci/giris"),
    queryFn: () => fetchQrCode(qrLink),
  });

  const selectedLesson = useMemo(() => {
    if (selectedLessonId) {
      if (qrLinkData) {
        return qrLinkData.find(
          (lesson) => lesson.lessonId === selectedLessonId
        );
      }
      if (activationCodeData) {
        return activationCodeData.find(
          (lesson) => lesson.lessonId === selectedLessonId
        );
      }
    }
  }, [activationCodeData, qrLinkData, selectedLessonId]);

  const studentLessons = useQueries({
    queries: studentNumbers.map((studentNo) => {
      return {
        queryKey: ["studentLessons", studentNo],
        enabled: !!selectedLesson?.lessonId,
        queryFn: () => fetchStudentLessons(studentNo),
      };
    }),
  });

  const allSuccess = studentLessons.every((num) => num.status === "success");

  const isStudentLessonLoading = studentLessons.every((num) => {
    if (!!selectedLesson?.lessonId) {
      return num.fetchStatus === "fetching";
    }
    return false;
  });

  const joiningStudents = useMemo(() => {
    if (allSuccess) {
      return studentNumbers.flatMap((studentNumber, i) => {
        const studentsLesson = studentLessons[i]?.data;

        const isStudentJoining = studentsLesson?.filter((less) => {
          const lessonCode = less.lessonCode.trim();
          const selectedLessonCode = selectedLesson?.lessonCode.trim();
          return lessonCode === selectedLessonCode;
        });

        if (isStudentJoining?.length) {
          return [studentNumber];
        }
        return [];
      });
    }
    return [];
  }, [allSuccess, selectedLesson?.lessonCode, studentLessons]);

  const studentsJoinLessons = useQueries({
    queries: joiningStudents.map((studentNo) => {
      return {
        queryKey: ["joinLesson", studentNo],
        enabled: false,
        queryFn: () =>
          joinLesson(
            studentNo,
            activationCode,
            qrLink,
            selectedLesson?.lessonId
          ),
      };
    }),
  });

  async function OnJoinClick() {
    toast.loading("Yoklama Alınıyor", { duration: 1000 });

    for (const lesson of studentsJoinLessons) {
      const i = studentsJoinLessons.indexOf(lesson);
      const { data } = await lesson.refetch();
      const student = allStudents[i];

      if (data && student) {
        toast.success(`${student.name} için ${data.header}`, {
          duration: 3000,
        });
      }
    }

    if (selectedLesson?.lessonName) {
      console.log(`Yoklama alındı: ${selectedLesson.lessonName}`);
      lecturePostJoin.mutate(selectedLesson.lessonName);
    }
  }

  return (
    <Layout>
      <div className="p-3">
        <Card>
          <CardHeader>
            <CardTitle>Yoklama</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div>
              <Label htmlFor="activation-code-input">Yoklama Kodu</Label>
              <Input
                id="activation-code-input"
                disabled={!!qrLink}
                placeholder="Aktivasyon Kodu"
                onChange={(event) => {
                  setActivationCode(event.target.value);
                  setQrLink("");
                }}
                value={activationCode}
                type="number"
              />
            </div>
            <Label htmlFor="qr-code-input">QR Link</Label>{" "}
            <div className="flex flex-row gap-2">
              <Input
                id="qr-code-input"
                disabled={!!activationCode}
                placeholder="QR Linki"
                onChange={(event) => {
                  setQrLink(event.target.value);
                  setActivationCode("");
                }}
                value={qrLink}
              />
              {isMobile && hydrated && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <QrCodeIcon />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>QR kod tarat</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col ">
                      <QrScanner
                        onResult={(result) => {
                          setQrLink(result.getText());
                          toast.success("QR Kod Tarandı");
                        }}
                        onError={console.error}
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            <Select onValueChange={(value) => setSelectedLessonId(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Ders Seçimi" />
              </SelectTrigger>
              <SelectContent>
                {activationCodeData &&
                  activationCodeData?.map((lesson) => {
                    return (
                      <SelectItem key={lesson.lessonId} value={lesson.lessonId}>
                        {lesson.lessonName}
                      </SelectItem>
                    );
                  })}
                {qrLinkData &&
                  qrLinkData?.map((lesson) => {
                    return (
                      <SelectItem key={lesson.lessonId} value={lesson.lessonId}>
                        {lesson.lessonName}
                      </SelectItem>
                    );
                  })}
              </SelectContent>
            </Select>
            <Button
              disabled={
                isStudentLessonLoading ||
                selectedLesson?.lessonId === "" ||
                (!qrLink && !activationCode) ||
                lecturePostJoin.isLoading
              }
              isLoading={isStudentLessonLoading || lecturePostJoin.isLoading}
              onClick={() => void OnJoinClick()}
            >
              Derse Katıl
            </Button>
            <JoiningStudents joiningStudentArray={joiningStudents} />
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

const fetchActivationCode = async (activationCode: string) => {
  return await fetch("https://ilker.abdulleziz.com/lectureInfo", {
    method: "POST",
    body: JSON.stringify({
      yoklamaKodu: activationCode,
      name: "dersBilgiGetir",
    }),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  }).then((res) => {
    return res.json() as Promise<getQrLessonsResponse[]>;
  });
};
const fetchQrCode = async (QrCode: string) => {
  return await fetch("https://ilker.abdulleziz.com/QR", {
    method: "POST",
    body: JSON.stringify({ url: QrCode }),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  }).then((res) => {
    return res.json() as Promise<getQrLessonsResponse[]>;
  });
};
const fetchStudentLessons = async (studentNo: string) => {
  return await fetch("https://ilker.abdulleziz.com/getStudentLessons", {
    method: "POST",
    body: JSON.stringify({
      studentNo: studentNo,
    }),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  }).then((res) => {
    return res.json() as Promise<getQrLessonsResponse[]>;
  });
};
const joinLesson = async (
  studentNo: string,
  activationCode: string,
  qrLink: string,
  lessonId?: string
) => {
  return await fetch("https://ilker.abdulleziz.com/joinLecture", {
    method: "POST",
    body: JSON.stringify({
      ogrenciNo: studentNo,
      yoklamaKodu: activationCode,
      yoklamaDers: lessonId,
      getKod: qrLink?.substring(qrLink.lastIndexOf("/") + 1),
    }),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  }).then((res) => res.json() as Promise<joinLectureResponse>);
};
export default Attendance;
