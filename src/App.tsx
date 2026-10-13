import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Gamepad2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type AppInfo = {
  name: string;
  version: string;
};

function App() {
  const [info, setInfo] = useState<AppInfo | null>(null);

  useEffect(() => {
    invoke<AppInfo>("app_info")
      .then(setInfo)
      .catch((error) => console.error("app_info failed:", error));
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Gamepad2 className="size-5" />
          </div>
          <CardTitle>{info?.name ?? "Awesome Gamepad UI"}</CardTitle>
          <CardDescription>
            Couch-first, gamepad-driven game launcher. The scaffold is up:
            Tauri v2, React 19, Tailwind v4 and shadcn are wired.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-y-1 text-sm">
            <dt className="text-muted-foreground">Rust backend</dt>
            <dd className="text-right font-mono">
              {info ? `v${info.version}` : "connecting…"}
            </dd>
          </dl>
        </CardContent>
        <CardFooter>
          <Button size="lg" className="w-full">
            <Gamepad2 />
            Scan Library
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default App;
