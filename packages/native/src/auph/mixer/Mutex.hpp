#pragma once

#include <pthread.h>

namespace auph {

class Mutex {
private:
    mutable pthread_mutex_t handle{};
public:
    Mutex() {
        pthread_mutexattr_t attr;
        pthread_mutexattr_init(&attr);
        pthread_mutex_init(&handle, &attr);

        // windows
        // InitializeCriticalSection(&handle);
    }

    ~Mutex() {
        pthread_mutex_destroy(&handle);

        // windows
        // DeleteCriticalSection(&handle);
    }

    void lock() const {
        pthread_mutex_lock(&handle);

        // windows
        //EnterCriticalSection(&handle);
    }

    void unlock() const {
        pthread_mutex_unlock(&handle);

        // windows
        //LeaveCriticalSection(&handle);
    }

};

}