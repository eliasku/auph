#pragma once

namespace auph {

struct BusObj {
    float gain = 1.0f;
    bool enabled = true;

    [[nodiscard]] float get() const {
        return enabled ? gain : 0.0f;
    }
};

}