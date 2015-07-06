# 0054

In this sketch I am going to try and use the single color via `r << 16 | g << 8 | b` rather than 3 different values. This should help keep the colors real (right now they are defaulting to one channel) and might let us get back towards 60 pixels per without much fuss.

This will be a copy of 0051 working on the images from 18 like 0053 did.

Need to figure out how to unshift before running.