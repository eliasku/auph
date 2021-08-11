#pragma once

namespace auph {

struct BusObj {
    float gain = 1.0f;
    uint32_t state = Bus_Connected | Bus_Active;

    [[nodiscard]] float get() const {
        return (state & Bus_Connected) != 0 ? gain : 0.0f;
    }
};

}