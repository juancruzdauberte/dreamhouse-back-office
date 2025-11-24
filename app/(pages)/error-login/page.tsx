import Image from "next/image";
export default function ErrorLogin() {
  return (
    <div className="min-h-screen flex items-center justify-center from-blue-50 via-white to-purple-50 px-4">
      <div className="w-full max-w-md">
        {/* Card principal */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-8 border border-gray-100">
          {/* Logo y título */}
          <div className="text-center space-y-3">
            <div className="border rounded-full border-black w-32 h-32 inline-flex items-center justify-center  shadow-lg mb-2">
              <Image
                src="https://res.cloudinary.com/dttpgbmdx/image/upload/v1758318130/dreamhouse.002.b16_ibpty8.jpg"
                alt="logo"
                width={80}
                height={80}
              />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Error al iniciar sesion
            </h1>
            <p className="text-gray-600">No tenes accesso</p>
          </div>
        </div>
      </div>
    </div>
  );
}
