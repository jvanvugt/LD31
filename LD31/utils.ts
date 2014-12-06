class Utils {
    static randomRange(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    static randomDir(): number {
        return ((Math.random() > 0.5) ? 1 : -1);
    }




}