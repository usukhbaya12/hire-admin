"use client";

import Image from "next/image";
import { useSession, signIn } from "next-auth/react";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Sparkles } from "lucide-react";
import {
  NotesBoldDuotone,
  LetterLineDuotone,
  KeyLineDuotone,
  PasswordLineDuotone,
} from "solar-icons";
import { toast } from "sonner";

import Loading from "@/app/loading";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";

const formSchema = z.object({
  email: z
    .string()
    .min(1, "И-мэйл хаягаа оруулна уу.")
    .email("И-мэйл хаяг буруу байна."),
  password: z.string().min(1, "Нууц үгээ оруулна уу."),
});

export default function Signin() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = form;

  const year = useMemo(() => new Date().getFullYear(), []);

  useEffect(() => {
    if (session) {
      router.push("/");
    }
  }, [session, router]);

  const onSubmit = async (values) => {
    try {
      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error(result.error || "Нэвтрэх үед алдаа гарлаа.");
        return;
      }

      toast.success("Амжилттай нэвтэрлээ.");
      router.push("/");
    } catch {
      toast.error("Сервертэй холбогдоход алдаа гарлаа.");
    }
  };

  if (status === "loading") return <Loading />;
  if (session) return null;

  return (
    <div className="min-h-screen bg-gray-50 lg:flex lg:items-center lg:justify-center lg:p-6">
      <div className="w-full min-h-screen bg-white lg:min-h-0 lg:h-[84vh] lg:w-[92vw] lg:max-w-[1200px] lg:overflow-hidden lg:rounded-[36px] lg:border lg:border-white/60 lg:shadow-[0_40px_120px_-24px_rgba(15,23,42,0.06)] lg:grid lg:grid-cols-[1.12fr_0.88fr]">
        <div className="relative hidden overflow-hidden p-10 lg:flex xl:p-14 bg-[radial-gradient(circle_at_78%_18%,rgba(255,255,255,0.06),transparent_18%),linear-gradient(145deg,#fdba74_0%,#fdba74_8%,#f36421_32%,#ea580c_72%,#c2410c_100%)]">
          <div className="absolute inset-0">
            <div className="absolute right-0 top-1/4 h-64 w-64 rounded-full bg-white/6 blur-3xl" />
            <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-[#7c2d12]/16 blur-3xl" />
          </div>

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative h-[420px] w-[420px] rounded-full border border-white/10 bg-white/[0.03] overflow-hidden">
              <Image
                src="/cover.png"
                alt="misc"
                fill
                className="object-cover opacity-[0.2] scale-[1.08]"
                priority
              />
            </div>
          </div>
          <Image
            src="/lay.png"
            alt="layout"
            width={320}
            height={420}
            draggable={false}
            priority
            id="wl8n35"
            className="absolute -bottom-4 right-5 z-20 h-auto w-[290px] object-contain drop-shadow-[0_18px_40px_rgba(0,0,0,0.12)]"
          />
          <div className="relative z-10 flex w-full flex-col">
            <div className="flex items-start justify-between">
              <Image
                src="/hire-2-white.png"
                width={80}
                height={40}
                alt="Hire logo"
                priority
              />
            </div>

            <div className="mt-20 max-w-[560px]">
              <div className="inline-block rounded-[32px] border border-white/15 bg-white/10 px-7 py-6 backdrop-blur-md shadow-[0_20px_60px_rgba(255,255,255,0.05)]">
                <h1 className="text-5xl font-black leading-[1.03] tracking-tight text-white">
                  ЗӨВ ХҮН,
                  <br />
                  ЗӨВ ГАЗАРТ
                </h1>

                <p className="mt-6 text-base text-white/75">
                  Онлайн тест, хөндлөнгийн үнэлгээ
                </p>

                <div className="mt-6 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur-md">
                  <Sparkles className="h-4 w-4" />
                  Удирдлагын систем
                </div>
              </div>
            </div>

            <div className="mt-auto pt-10 text-white/85">
              © {year} Аксиом Инк.
            </div>
          </div>
        </div>

        <div className="flex min-h-screen flex-col bg-white px-6 py-8 sm:px-10 lg:min-h-0 lg:justify-center lg:px-12 xl:px-16">
          <div className="flex justify-center lg:hidden">
            <Image
              src="/hire-2.png"
              width={80}
              height={38}
              alt="Hire logo"
              priority
            />
          </div>

          <div className="flex flex-1 items-center justify-left py-8 lg:py-0">
            <div className="w-full max-w-md">
              <div className="mb-8">
                <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-[#f36421] ring-1 ring-orange-100">
                  <NotesBoldDuotone width={30} height={30} />
                </div>

                <h2 className="text-3xl font-black tracking-tight text-slate-900">
                  Нэвтрэх
                </h2>

                <p className="mt-2 leading-7 text-slate-500">
                  Сайн уу, Админ? 👋
                </p>
              </div>

              <form
                onSubmit={handleSubmit(onSubmit)}
                noValidate
                className="space-y-8"
              >
                <FieldGroup>
                  <Controller
                    name="email"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="signin-email">
                          И-мэйл хаяг
                        </FieldLabel>
                        <InputGroup>
                          <InputGroupAddon>
                            <LetterLineDuotone />
                          </InputGroupAddon>
                          <InputGroupInput
                            {...field}
                            id="signin-email"
                            type="text"
                            inputMode="email"
                            autoComplete="email"
                            placeholder="И-мэйл хаяг"
                            aria-invalid={fieldState.invalid}
                            onChange={field.onChange}
                          />
                        </InputGroup>
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    name="password"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="signin-password">
                          Нууц үг
                        </FieldLabel>
                        <InputGroup>
                          <InputGroupAddon>
                            <KeyLineDuotone />
                          </InputGroupAddon>
                          <InputGroupInput
                            {...field}
                            id="signin-password"
                            type="password"
                            autoComplete="current-password"
                            placeholder="Нууц үг"
                            aria-invalid={fieldState.invalid}
                            onChange={field.onChange}
                          />
                        </InputGroup>

                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                </FieldGroup>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting && <Spinner data-icon="inline-start" />}
                  Нэвтрэх
                </Button>

                <div className="pt-2">
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-700 ring-1 ring-slate-200">
                      <PasswordLineDuotone />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">
                        Нууц үгээ мартсан уу?
                      </p>
                      <p className="text-sm text-slate-500">
                        Үндсэн сайтаар орж нууц үгээ сэргээгээрэй.
                      </p>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>

          <div className="pt-6 text-center text-slate-400 lg:hidden">
            © {year} Аксиом Инк.
          </div>
        </div>
      </div>
    </div>
  );
}
