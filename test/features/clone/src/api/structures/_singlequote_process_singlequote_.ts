export type ResourceUsage = {
    fsRead: number;
    fsWrite: number;
    involuntaryContextSwitches: number;
    ipcReceived: number;
    ipcSent: number;
    majorPageFault: number;
    maxRSS: number;
    minorPageFault: number;
    sharedMemorySize: number;
    signalsCount: number;
    swappedOut: number;
    systemCPUTime: number;
    unsharedDataSize: number;
    unsharedStackSize: number;
    userCPUTime: number;
    voluntaryContextSwitches: number;
}
export namespace _singlequote_process_singlequote_ {
    export type ResourceUsage = {
        fsRead: number;
        fsWrite: number;
        involuntaryContextSwitches: number;
        ipcReceived: number;
        ipcSent: number;
        majorPageFault: number;
        maxRSS: number;
        minorPageFault: number;
        sharedMemorySize: number;
        signalsCount: number;
        swappedOut: number;
        systemCPUTime: number;
        unsharedDataSize: number;
        unsharedStackSize: number;
        userCPUTime: number;
        voluntaryContextSwitches: number;
    }
    export namespace global {
        export type ResourceUsage = {
            fsRead: number;
            fsWrite: number;
            involuntaryContextSwitches: number;
            ipcReceived: number;
            ipcSent: number;
            majorPageFault: number;
            maxRSS: number;
            minorPageFault: number;
            sharedMemorySize: number;
            signalsCount: number;
            swappedOut: number;
            systemCPUTime: number;
            unsharedDataSize: number;
            unsharedStackSize: number;
            userCPUTime: number;
            voluntaryContextSwitches: number;
        }
        export namespace NodeJS {
            export type CpuUsage = {
                user: number;
                system: number;
            }
            export type MemoryUsage = {
                rss: number;
                heapTotal: number;
                heapUsed: number;
                external: number;
                arrayBuffers: number;
            }
            export type ResourceUsage = {
                fsRead: number;
                fsWrite: number;
                involuntaryContextSwitches: number;
                ipcReceived: number;
                ipcSent: number;
                majorPageFault: number;
                maxRSS: number;
                minorPageFault: number;
                sharedMemorySize: number;
                signalsCount: number;
                swappedOut: number;
                systemCPUTime: number;
                unsharedDataSize: number;
                unsharedStackSize: number;
                userCPUTime: number;
                voluntaryContextSwitches: number;
            }
        }
    }
}