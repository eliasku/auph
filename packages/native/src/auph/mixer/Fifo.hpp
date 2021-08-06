#pragma once

#include "RingBuffer.hpp"

namespace auph {

#define DIAG_ASSERT(x) assert(x)
//#define DIAG_ASSERT(x) (void)(0)

/**
 *
 * @reference https://github.com/google/oboe/blob/master/samples/RhythmGame/src/main/cpp/utils/LockFreeQueue.h
 * @reference sokol audio
 */
class Fifo {
public:
    //  number of packet in fifo
    uint32_t packetsCount;
    // size of a single packets in bytes(!) 
    uint32_t packetByteSize;
    // packet memory chunk base pointer (dynamically allocated)
    uint8_t* data;
    // current write-packet
    uint32_t currentPacket;
    // current byte-offset into current write packet
    uint32_t currentOffset;
    // buffers with data, ready to be streamed
    RingBuffer readQueue;
    // empty buffers, ready to be pushed to
    RingBuffer writeQueue;

    Fifo(uint32_t packetsCount_, uint32_t packetByteSize_) :
            packetsCount{packetsCount_},
            readQueue{packetsCount_},
            writeQueue{packetsCount_} {
        DIAG_ASSERT((packetByteSize_ > 0) && (packetsCount_ > 0));
        packetByteSize = packetByteSize_;
        data = new uint8_t[packetByteSize_ * packetsCount_];
        DIAG_ASSERT(this->data);
        currentPacket = -1;
        currentOffset = 0;
        for (int i = 0; i < packetsCount_; ++i) {
            writeQueue.enqueue(i);
        }
        DIAG_ASSERT(writeQueue.full());
        DIAG_ASSERT(writeQueue.count() == packetsCount_);
        DIAG_ASSERT(readQueue.empty());
        DIAG_ASSERT(readQueue.count() == 0);
    }

    ~Fifo() {
        delete[] data;
    }

    [[nodiscard]]
    uint32_t availableBytesToWrite() const {
        unsigned availableBytes = writeQueue.count() * packetByteSize;
        if (currentPacket != -1) {
            availableBytes += packetByteSize - currentOffset;
        }
        DIAG_ASSERT(availableBytes >= 0);
        DIAG_ASSERT(availableBytes <= (packetsCount * packetByteSize));
        return availableBytes;
    }

    /* write new data to the write queue, this is called from main thread */
    uint32_t write(const uint8_t* sourceBuffer, uint32_t bytesToWrite) {
        /* returns the number of bytes written, this will be smaller then requested
            if the write queue runs full
        */
        uint32_t allToCopy = bytesToWrite;
        while (allToCopy > 0) {
            /* need to grab a new packet? */
            if (currentPacket == -1) {
                if (!writeQueue.empty()) {
                    currentPacket = writeQueue.dequeue();
                }
                DIAG_ASSERT(currentOffset == 0);
            }
            /* append data to current write packet */
            if (currentPacket != -1) {
                uint32_t to_copy = allToCopy;
                const uint32_t max_copy = packetByteSize - currentOffset;
                if (to_copy > max_copy) {
                    to_copy = max_copy;
                }
                uint8_t* dst = data + currentPacket * packetByteSize + currentOffset;
                memcpy(dst, sourceBuffer, to_copy);
                sourceBuffer += to_copy;
                currentOffset += to_copy;
                allToCopy -= to_copy;
                DIAG_ASSERT(currentOffset <= packetByteSize);
                DIAG_ASSERT(allToCopy >= 0);
            } else {
                /* early out if we're starving */
                const uint32_t bytes_copied = bytesToWrite - allToCopy;
                DIAG_ASSERT((bytes_copied >= 0) && (bytes_copied < bytesToWrite));
                return bytes_copied;
            }
            /* if write packet is full, push to read queue */
            if (currentOffset == packetByteSize) {
                readQueue.enqueue(currentPacket);
                currentPacket = -1;
                currentOffset = 0;
            }
        }
        DIAG_ASSERT(allToCopy == 0);
        return bytesToWrite;
    }

    /* read queued data, this is called form the stream callback (maybe separate thread) */
    uint32_t read(uint8_t* destinationBuffer, uint32_t bytesToRead) {
        /* NOTE: fifo_read might be called before the fifo is properly initialized */
        uint32_t copiedByteSize = 0;
        DIAG_ASSERT(0 == (bytesToRead % packetByteSize));
        DIAG_ASSERT(bytesToRead <= (packetByteSize * packetsCount));
        const uint32_t num_packets_needed = bytesToRead / packetByteSize;
        uint8_t* dst = destinationBuffer;
        /* either pull a full buffer worth of data, or nothing */
        if (readQueue.count() >= num_packets_needed) {
            for (int i = 0; i < num_packets_needed; i++) {
                unsigned packetIndex = readQueue.dequeue();
                writeQueue.enqueue(packetIndex);
                const uint8_t* src = data + packetIndex * packetByteSize;
                memcpy(dst, src, (size_t) packetByteSize);
                dst += packetByteSize;
                copiedByteSize += packetByteSize;
            }
            DIAG_ASSERT(bytesToRead == copiedByteSize);
        }
        return copiedByteSize;
    }
};

#undef DIAG_ASSERT

}
