const Loader = () => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
            <div className="flex flex-col items-center gap-4">
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-white border-t-red-600"></div>
                <p className="text-white">Загрузка...</p>
            </div>
        </div>
    );
};

export default Loader;

