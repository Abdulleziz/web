import { type NextPage } from "next";
import { useEffect, useMemo, useRef, useState } from "react";
import { Layout } from "~/components/Layout";
import { useHydrated } from "../_app";
import { Button } from "~/components/ui/button";
import { QrCodeIcon } from "lucide-react";
import { QrScanner } from "@yudiel/react-qr-scanner";
import useDevice from "~/hooks/useDevice";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
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
  {
    name: "Taha",
    no: "20202022008",
  },
];

const Attendance: NextPage = () => {
  const [qrLink, setQrLink] = useState<string>("");
  const [activationCode, setActivationCode] = useState<string>("");
  const [selectedLesson, setSelectedLesson] = useState<getQrLessonsResponse>({
    lessonName: "",
    lessonId: "",
    lessonCode: "",
  });
  const [lessons, setLessons] = useState<getQrLessonsResponse[]>([]);
  const hydrated = useHydrated();
  const { isMobile } = useDevice();
  const joiningStudentArray: string[] = useMemo(() => [], []);
  //! get lessons with Qr code
  useEffect(() => {
    if (qrLink?.startsWith("https://pdks.nisantasi.edu.tr/ogrenci/giris")) {
      void fetch("https://ilker.abdulleziz.com/QR", {
        method: "POST",
        body: JSON.stringify({ url: qrLink }),
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
        .then((res) => {
          if (!res.ok) {
            toast.error("Ders Bulunamadı!");
            return;
          }
          toast.success("Dersler Bulundu");
          return res.json();
        })
        .then(setLessons);
    } else {
      setLessons([]);
      setQrLink("");
    }
  }, [qrLink]);

  //! get lessons with activation code
  useEffect(() => {
    if (activationCode?.length === 7) {
      void fetch("https://ilker.abdulleziz.com/lectureInfo", {
        method: "POST",
        body: JSON.stringify({
          yoklamaKodu: activationCode,
          name: "dersBilgiGetir",
        }),
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
        .then((res) => {
          if (!res.ok) {
            toast.error("Ders Bulunamadı!");
            return;
          }
          toast.success("Dersler Bulundu");
          return res.json();
        })
        .then(setLessons);
    } else {
      setLessons([]);
    }
  }, [activationCode]);

  const prevSelectedLesson = useRef<string | undefined>();

  useEffect(() => {
    // Check if selectedLesson has changed
    if (prevSelectedLesson.current !== selectedLesson.lessonId) {
      if (
        (selectedLesson && activationCode.length === 7) ||
        qrLink?.startsWith("https://pdks.nisantasi.edu.tr/ogrenci/giris")
      ) {
        joiningStudentArray.length = 0;
        allStudents.map((student) => {
          void fetch("https://ilker.abdulleziz.com/getStudentLessons", {
            method: "POST",
            body: JSON.stringify({
              studentNo: student.no,
            }),
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          })
            .then((res) => {
              if (!res.ok) {
                return;
              }
              return res.json();
            })
            .then((data: getQrLessonsResponse[]) => {
              data.map((lesson) => {
                if (
                  lesson.lessonCode.trim() === selectedLesson.lessonCode.trim()
                ) {
                  joiningStudentArray.push(student.no);
                }
              });
            });
        });
      }

      // Update the previous value of selectedLesson
      prevSelectedLesson.current = selectedLesson.lessonId;
    }
  }, [activationCode, joiningStudentArray, qrLink, selectedLesson]);

  return (
    <Layout>
      <div className="p-3">
        <Card>
          <CardHeader>
            <CardTitle>Yoklama</CardTitle>
            <CardDescription>API UPDATE EDILMELI</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div>
              <Label htmlFor="activation-code-input">Yoklama Kodu</Label>
              <Input
                id="activation-code-input"
                placeholder="Aktivasyon Kodu"
                onChange={(event) => setActivationCode(event.target.value)}
                value={activationCode}
                type="number"
              />
            </div>
            <Label htmlFor="qr-code-input">QR Link</Label>{" "}
            <div className="flex flex-row gap-2">
              <Input
                id="qr-code-input"
                placeholder="QR Linki"
                onChange={(event) => setQrLink(event.target.value)}
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
                        onError={(err) => console.log(err)}
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            <Select
              disabled={!lessons}
              onValueChange={(value) => {
                const selectedLesson = lessons.find(({ lessonId }) => {
                  return lessonId === value;
                });
                if (selectedLesson) {
                  setSelectedLesson(selectedLesson);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Ders Seçimi" />
              </SelectTrigger>
              <SelectContent>
                {lessons?.map((lesson) => {
                  return (
                    <SelectItem key={lesson.lessonId} value={lesson.lessonId}>
                      {lesson.lessonName}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <Button
              disabled={selectedLesson.lessonId === ""}
              onClick={() => {
                if (selectedLesson) {
                  joiningStudentArray.map((value) => {
                    const promise = fetch(
                      "https://ilker.abdulleziz.com/joinLecture",
                      {
                        method: "POST",
                        body: JSON.stringify({
                          ogrenciNo: value,
                          yoklamaKodu: activationCode,
                          yoklamaDers: selectedLesson.lessonId,
                          getKod: qrLink?.substring(
                            qrLink.lastIndexOf("/") + 1
                          ),
                        }),
                        headers: {
                          "Content-Type": "application/json",
                          Accept: "application/json",
                        },
                      }
                    )
                      .then((res) => res.json())
                      .then((data: joinLectureResponse) => {
                        return data;
                      });
                    const studentDetail = allStudents.find(({ no }) => {
                      return no === value;
                    });
                    if (studentDetail) {
                      void toast.promise(
                        promise,
                        {
                          loading: "Katılınıyor",
                          success: (data) =>
                            `Öğrenci:${studentDetail?.name} için ${data.header}`,
                          error: "Bir hata oluştu",
                        },
                        { duration: 5000 }
                      );
                    }
                    return;
                  });
                }
              }}
            >
              Derse Katıl
            </Button>
            {/* 
            //!Buglı şuanda wip but it works XD
            <JoiningStudents joiningStudentArray={joiningStudentArray} /> */}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Attendance;
