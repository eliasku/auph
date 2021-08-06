#pragma once

#include <cstdint>
#include <atomic>

#define DIAG_ASSERT(x) assert(x)
//#define DIAG_ASSERT(x) (void)(0)

namespace auph {

class RingBuffer {
public:
    // writeCounter: next slot to write to
    std::atomic<uint32_t> head{0};
    // readCounter: next slot to read from
    std::atomic<uint32_t> tail{0};

    uint32_t capacity;
    uint32_t* queue;

    explicit RingBuffer(uint32_t capacity_) :
            head{0},
            tail{0},
            capacity{capacity_} {

        // power of two
        DIAG_ASSERT(capacity_ > 1);
        DIAG_ASSERT((capacity_ & (capacity_ - 1u)) == 0u);
        // keep reasonable size
        DIAG_ASSERT(capacity_ <= 4096);

        queue = new uint32_t[capacity_];
    }

    ~RingBuffer() {
        delete[] queue;
    }

    [[nodiscard]]
    uint32_t mask(uint32_t i) const {
        return i & (capacity - 1);
    }

    [[nodiscard]]
    bool full() const {
        return count() == capacity;
    }

    [[nodiscard]]
    bool empty() const {
        return head == tail;
    }

    [[nodiscard]]
    uint32_t count() const {
        const uint32_t total = head - tail;
        DIAG_ASSERT(total <= capacity);
        return total;
    }

    void enqueue(uint32_t val) {
        DIAG_ASSERT(!full());
        queue[mask(head)] = val;
        ++head;
    }

    uint32_t dequeue() {
        DIAG_ASSERT(!empty());
        const uint32_t val = queue[mask(tail)];
        ++tail;
        return val;
    }
};

#undef DIAG_ASSERT

}