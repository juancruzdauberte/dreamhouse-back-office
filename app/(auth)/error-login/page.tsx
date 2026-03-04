import Image from "next/image";
export default function ErrorLogin() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Card principal */}
        <div className="bg-card rounded-2xl p-8 space-y-8 border border-border">
          {/* Logo y título */}
          <div className="text-center space-y-3">
            <div className="border border-border rounded-full w-32 h-32 inline-flex items-center justify-center mb-2">
              <Image
                src="https://res.cloudinary.com/dttpgbmdx/image/upload/v1758318130/dreamhouse.002.b16_ibpty8.jpg"
                alt="logo"
                width={80}
                height={80}
              />
            </div>
            <h1 className="text-3xl font-bold text-foreground">
              Error al iniciar sesion
            </h1>
            <p className="text-muted-foreground">No tenes accesso</p>
          </div>
        </div>
      </div>
    </div>
  );
}
