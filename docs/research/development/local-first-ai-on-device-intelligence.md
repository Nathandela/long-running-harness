---
title: "Local-First AI and On-Device Intelligence"
date: 2026-03-21
summary: Surveys the emerging paradigm of capable AI systems running entirely on personal devices without cloud dependency, covering model quantization for edge inference, differential privacy in local contexts, on-device knowledge graphs, local-first architecture principles, and privacy-preserving personal AI assistants. Organizes ten approach families along axes of computational efficiency, privacy guarantees, data sovereignty, and offline capability, documenting trade-offs without prescribing deployment choices.
keywords: [development, local-first-ai, edge-inference, model-quantization, privacy-preserving-ai]
---

# Local-First AI and On-Device Intelligence

*21 March 2026*

---

## Abstract

The convergence of increasingly capable small language models, efficient quantization techniques, and local-first software architecture principles has created a viable pathway for AI systems that run entirely on consumer hardware — laptops, smartphones, and tablets — without requiring cloud connectivity or transmitting personal data to remote servers. This survey examines the research landscape across five intersecting domains: model compression and edge inference, differential privacy applied to on-device learning, local knowledge graphs and personal data organization, local-first architecture and synchronization protocols, and the design of privacy-preserving personal AI assistants. The analysis identifies ten distinct approach families, each with characteristic trade-offs among model quality, computational cost, privacy guarantees, and user experience.

The motivation for this survey is both technical and societal. Cloud-dependent AI systems impose structural dependencies on network connectivity, create privacy risks through centralized data aggregation, and concentrate control over personal intelligence in a small number of infrastructure providers. The "Small Tech" counter-movement — exemplified by local inference engines, on-device vector databases, and conflict-free replicated data types for offline synchronization — offers an alternative architecture where the user's device is the primary site of computation and data residency. This survey documents the current state of that alternative without advocating for or against specific deployment configurations.

The scope explicitly excludes general differential privacy theory (covered separately in the companion survey on privacy engineering and differential privacy) and focuses instead on the application of privacy techniques to local-first contexts: on-device fine-tuning, federated learning across personal device fleets, and local data processing with formal privacy guarantees. The survey concludes by identifying open problems including the quality gap between quantized and full-precision models at small parameter counts, the absence of standardized benchmarks for on-device inference across heterogeneous hardware, and the challenge of building personal knowledge systems that are simultaneously comprehensive, private, and semantically coherent.

---

## 1. Introduction

### 1.1 Problem Statement

Contemporary AI systems overwhelmingly depend on cloud infrastructure. A user's query to a language model traverses the public internet, reaches a data center, is processed on GPU clusters owned by the model provider, and returns through the same path. This architecture creates three classes of structural problem. First, a privacy problem: the user's data — including prompts, documents, and behavioral patterns — is necessarily exposed to the service provider and any entity with access to its infrastructure. Second, a reliability problem: the system is inoperable without network connectivity, creating fragile dependency on infrastructure outside the user's control. Third, a sovereignty problem: the user's intellectual output, personal knowledge, and interaction history reside on systems governed by corporate terms of service rather than personal ownership. [McMahan et al. 2017](https://arxiv.org/abs/1602.05629)

Local-first AI addresses these problems by moving computation to the user's device. The technical feasibility of this approach has shifted dramatically since 2023, driven by three developments: the release of high-quality small language models (Llama 2 7B, Mistral 7B, Phi-2, Gemma 2B, Llama 3.x, Qwen 2.5), advances in quantization that reduce memory requirements by 4-8x with modest quality loss, and hardware acceleration frameworks (Apple MLX, CoreML, Android NNAPI, Qualcomm AI Engine) that exploit the increasingly capable neural processing units in consumer devices. [Touvron et al. 2023](https://arxiv.org/abs/2307.09288)

### 1.2 Scope and Definitions

This survey covers ten approach families organized into five thematic areas:

1. **Model compression and edge inference**: Post-training quantization (GPTQ, AWQ, GGUF/GGML), quantization-aware training (QLoRA), framework-specific optimization (Apple MLX, ExecuTorch), and hardware acceleration on consumer silicon.
2. **On-device learning with privacy**: Federated learning for personal devices, on-device fine-tuning with differential privacy guarantees, and local adaptation without data exfiltration.
3. **Local knowledge organization**: On-device vector databases, local embedding models, personal knowledge graphs, and semantic search over personal data.
4. **Local-first architecture**: CRDTs, offline-first design patterns, synchronization protocols, and the Ink & Switch local-first principles.
5. **Privacy-preserving personal assistants**: System architecture for "private brain" applications, threat models, trust boundaries, and security considerations.

### 1.3 Key Definitions

**Local-first software**: Software that stores the primary copy of user data on the user's local device, functions fully without network connectivity, and treats cloud services as optional, secondary replicas rather than canonical sources of truth. The term was formalized by Kleppmann et al. in the Ink & Switch "Local-First Software" essay (2019). [Kleppmann et al. 2019](https://www.inkandswitch.com/local-first/)

**On-device inference**: Execution of a machine learning model's forward pass entirely on consumer hardware (laptop, phone, tablet) without transmitting input data or intermediate activations to a remote server.

**Model quantization**: The process of reducing the numerical precision of model weights and/or activations from higher-precision formats (FP32, FP16) to lower-precision formats (INT8, INT4, or mixed-precision schemes), thereby reducing memory footprint and often increasing inference throughput at the cost of some model quality.

**Edge computing**: Computation performed at or near the data source rather than in a centralized data center. In this survey, "edge" refers specifically to personal consumer devices, not intermediate edge servers or CDN nodes.

**Private brain**: An informal term for a personal AI assistant with comprehensive access to an individual's digital life (documents, emails, notes, browsing history, financial records) that processes all data locally and never transmits raw personal data to external servers.

---

## 2. Foundations

### 2.1 Edge Computing and the Shift to Device Intelligence

The trajectory from cloud computing to edge inference follows a well-documented pattern in distributed systems: as end-device capability increases, computation migrates toward the data source. Early mobile ML was limited to simple classifiers (spam detection, keyboard prediction), but the introduction of dedicated neural processing hardware — Apple's Neural Engine (2017-present, scaling from 600 billion to 38 trillion operations per second by A17 Pro), Qualcomm's Hexagon DSP and AI Engine, Google's Tensor Processing Unit in Pixel devices — has enabled increasingly complex on-device models. [Howard et al. 2017](https://arxiv.org/abs/1704.04861)

The hardware trajectory matters quantitatively. An Apple M4 MacBook Pro (2024) provides approximately 38 TOPS (trillion operations per second) from its Neural Engine alone, with additional compute from GPU and CPU cores. Unified memory architectures (Apple Silicon's shared CPU/GPU/Neural Engine memory pool of 16-192 GB) eliminate the memory-copy bottleneck that historically constrained on-device inference. An M4 Pro with 48 GB unified memory can hold a 30-billion-parameter model quantized to 4-bit precision entirely in memory, with bandwidth sufficient for interactive token generation rates. Similar capability exists on the Android side through Qualcomm Snapdragon 8 Gen 3 and Samsung Exynos 2400 with dedicated NPUs, though with tighter memory constraints (12-24 GB shared between system and ML workloads). [Apple 2024](https://developer.apple.com/machine-learning/core-ml/)

### 2.2 Local-First Principles

The local-first software movement, articulated most clearly by Kleppmann, Wiggins, van Hardenberg, and McGranaghan at Ink & Switch (2019), identifies seven ideals for software that prioritizes user ownership and offline capability:

1. **No spinners**: Work is never blocked waiting for a server.
2. **Your work is not trapped on one device**: Data synchronizes across devices.
3. **The network is optional**: Full functionality without internet.
4. **Seamless collaboration**: Multiple users can work concurrently.
5. **The Long Now**: Data outlives the application and the company that made it.
6. **Security and privacy by default**: End-to-end encryption; no server-side access.
7. **User retains ownership and control**: No vendor lock-in; data export always possible.

These principles, originally articulated for collaborative document editing (Automerge, Yjs), apply directly to local AI systems. A local-first AI assistant satisfies all seven ideals when it stores models and data on-device, synchronizes across a user's device fleet via encrypted peer-to-peer protocols, and processes all queries locally. [Kleppmann et al. 2019](https://www.inkandswitch.com/local-first/)

### 2.3 Quantization Theory

Model quantization reduces the precision of neural network parameters from floating-point to lower-bit representations. The theoretical foundation rests on the observation that neural network weights are robust to bounded perturbation: if the quantization error per weight is small relative to the weight's magnitude, the network's output distribution shifts only slightly. Formally, for a weight matrix W and its quantized approximation Q(W), the quantization error ||W - Q(W)||_F should be minimized subject to the constraint that Q(W) uses only values from a discrete codebook of size 2^b for b-bit quantization. [Nagel et al. 2021](https://arxiv.org/abs/2106.08295)

Three families of quantization dominate current practice:

**Uniform quantization** maps a continuous range [alpha, beta] to 2^b evenly spaced levels via an affine transformation: q = round((x - z) / s), where s is the scale factor and z the zero-point. This approach is hardware-friendly because dequantization requires only a multiply-add, but it wastes codebook entries in regions of low weight density.

**Non-uniform quantization** assigns codebook entries according to the empirical weight distribution, often using k-means clustering. This achieves lower quantization error for the same bit budget but requires lookup-table dequantization, which is less amenable to hardware acceleration.

**Mixed-precision quantization** assigns different bit-widths to different layers or weight groups based on sensitivity analysis. Layers whose outputs are highly sensitive to weight perturbation (often attention projection matrices and the first/last layers) receive higher precision, while less sensitive layers (often feed-forward blocks in middle layers) are aggressively quantized. [Dettmers et al. 2022](https://arxiv.org/abs/2208.07339)

### 2.4 Differential Privacy in Local Contexts

While the formal theory of differential privacy is covered in the companion survey, the application to local-first systems involves specific architectural choices. The key distinction is between central DP (a trusted curator adds noise to aggregated data) and local DP (each user perturbs their own data before any aggregation). Local-first AI systems typically operate in a local DP regime or a stronger "no-collection" regime where data never leaves the device at all. [Dwork & Roth 2014](https://www.cis.upenn.edu/~aaroth/Papers/privacybook.pdf)

On-device fine-tuning introduces a specific privacy concern: even if the base model is public, a fine-tuned model's weights encode information about the fine-tuning data, and weight differences between the base and fine-tuned model can be attacked to extract training examples. Differential privacy applied to fine-tuning (DP-SGD, where gradient updates are clipped and noised) provides a formal bound on information leakage, but at the cost of reduced fine-tuning quality and increased computational overhead. In the local-first context, this matters primarily when fine-tuned models or their weight updates are shared across devices (e.g., through federated learning), not when the fine-tuned model remains entirely on a single device under the user's physical control. [Abadi et al. 2016](https://arxiv.org/abs/1607.00133)

---

## 3. Taxonomy of Approaches

The landscape of local-first AI can be organized into ten approach families across five thematic domains. Table 1 classifies these along axes of mechanism type, primary benefit, hardware requirements, and privacy model.

**Table 1. Taxonomy of local-first AI approaches**

| ID | Approach Family | Mechanism | Primary Benefit | Hardware Requirement | Privacy Model |
|----|----------------|-----------|-----------------|---------------------|---------------|
| A | Post-training quantization (GPTQ, AWQ, GGUF) | Weight-only or weight-activation quantization after training | Reduced memory footprint; faster inference | CPU/GPU with 4-64 GB RAM | No data leaves device |
| B | Quantization-aware training and fine-tuning (QLoRA) | Low-rank adapters trained in quantized precision | Task adaptation with minimal memory | GPU with 8+ GB VRAM or unified memory | DP-SGD optional for shared adapters |
| C | Framework-optimized on-device inference (MLX, ExecuTorch, MLC-LLM) | Hardware-specific kernel optimization and memory management | Maximum throughput on specific hardware | Platform-specific accelerators | No data leaves device |
| D | Federated learning for personal devices | Distributed training with local gradient computation | Collaborative model improvement without data sharing | Fleet of user devices with coordination server | Central DP or secure aggregation |
| E | On-device fine-tuning with differential privacy | DP-SGD applied to local adaptation | Formal privacy guarantees for shared updates | Device with sufficient compute for backpropagation | (epsilon, delta)-DP per update |
| F | Local vector databases and embedding search | On-device embedding generation and approximate nearest neighbor search | Semantic search over personal data | CPU with 2+ GB RAM for embedding model | No data leaves device |
| G | Personal knowledge graphs | Structured entity-relation storage with semantic enrichment | Organized, queryable personal knowledge | Modest storage and compute | No data leaves device |
| H | CRDTs and local-first synchronization | Conflict-free replicated data types for multi-device sync | Offline operation with eventual consistency | Minimal; works on constrained devices | End-to-end encrypted sync |
| I | Offline-first application architecture | Service workers, local caches, optimistic updates | Uninterrupted operation without connectivity | Standard web or mobile platform | Data residency on device |
| J | Privacy-preserving personal AI assistants | Orchestration of local models, knowledge bases, and tools | Comprehensive personal intelligence with zero data exfiltration | Combined requirements of A/B/C + F/G | Defense-in-depth; no remote transmission |

This taxonomy reveals a compositional structure: approach J (the full "private brain") requires integrating approaches from multiple other families (A or C for inference, F and G for knowledge, H and I for architecture). The remaining sections analyze each approach in detail.

---

## 4. Analysis

### 4.1 Post-Training Quantization: GPTQ, AWQ, and GGUF (Approach A)

**Theory and mechanism.** Post-training quantization (PTQ) converts a pre-trained model's weights from 16-bit or 32-bit floating point to lower-precision integer representations without retraining. The challenge is minimizing the output perturbation caused by quantization error, which compounds through successive layers. Three dominant approaches have emerged for large language models, each addressing this challenge differently. [Frantar et al. 2022](https://arxiv.org/abs/2210.17323)

GPTQ (Frantar et al. 2022) extends the Optimal Brain Quantizer framework to transformer-scale models by quantizing weights one column at a time within each layer, using a second-order (Hessian-based) error correction that adjusts remaining unquantized weights to compensate for each quantization decision. The algorithm processes a calibration dataset (typically 128-256 sequences) to estimate the Hessian of the layer-wise reconstruction loss, then applies a greedy quantization procedure that requires only a single forward pass through the calibration data. GPTQ achieves 4-bit quantization of 175B-parameter models with perplexity increases of less than 0.5 on WikiText-2 and can quantize a model in minutes to hours on a single GPU. [Frantar et al. 2022](https://arxiv.org/abs/2210.17323)

AWQ (Activation-Aware Weight Quantization, Lin et al. 2023) takes a different approach: rather than optimizing quantization decisions via second-order methods, it observes that a small fraction of weights (typically 1%) are disproportionately important because they correspond to channels with large activation magnitudes. AWQ scales these salient weight channels up before quantization (and compensates by scaling activations down), effectively giving important weights more of the available dynamic range. This requires no backpropagation or complex optimization — only activation statistics from a calibration set. AWQ achieves quality comparable to GPTQ at 4-bit with faster quantization times and often better generalization to tasks not represented in the calibration data. [Lin et al. 2023](https://arxiv.org/abs/2306.00978)

GGML/GGUF (Gerganov, 2023-present) is a practical tensor library and file format designed specifically for CPU-based LLM inference on consumer hardware. Unlike GPTQ and AWQ, which were developed as research contributions, GGML emerged from the llama.cpp project with a focus on engineering pragmatism: it supports multiple quantization types (Q2_K through Q8_0, with "K-quants" using mixed-precision per-block quantization), runs on CPUs with optional GPU offloading, and uses memory-mapped file I/O to enable models larger than available RAM. The GGUF format (successor to GGML) provides a self-describing container that includes model architecture metadata, tokenizer configuration, and quantized weights in a single file. [Gerganov 2023](https://github.com/ggerganov/llama.cpp)

**Evidence and benchmarks.** Empirical evaluations consistently show that 4-bit quantization of models with 7B+ parameters preserves most of the original model quality. On the Llama 2 7B model, GPTQ 4-bit quantization increases WikiText-2 perplexity from approximately 5.47 to 5.63 (a 3% increase), while GGUF Q4_K_M achieves similar perplexity with the advantage of CPU execution. At 3-bit quantization, quality degradation becomes more noticeable (perplexity increases of 10-20% on standard benchmarks), and at 2-bit, models exhibit significant coherence loss, particularly on reasoning-heavy tasks. [Dettmers et al. 2023](https://arxiv.org/abs/2305.14314)

The quality-size trade-off exhibits a critical interaction with model scale: quantizing a 70B model to 4-bit (yielding approximately 40 GB) often produces higher quality than running a 7B model at full 16-bit precision (approximately 14 GB), because the larger model's redundancy absorbs quantization noise more gracefully. This finding (documented by Dettmers et al. in the "LLM.int8()" and subsequent work) has practical implications: users with 64 GB of unified memory may achieve better results running a 4-bit 70B model than a full-precision 7B model, despite the larger total memory footprint. [Dettmers et al. 2022](https://arxiv.org/abs/2208.07339)

Inference speed benchmarks on Apple Silicon show that llama.cpp with GGUF Q4_K_M achieves 30-60 tokens per second for 7B models on M2/M3/M4 MacBooks, depending on context length and batch size. For 70B models at 4-bit on M4 Max (128 GB), generation rates of 8-15 tokens per second are achievable, which is adequate for interactive use. On mobile devices (iPhone 15 Pro with 8 GB RAM, A17 Pro), 3B-parameter quantized models run at 15-30 tokens per second, sufficient for basic assistant functionality but limiting for complex multi-step reasoning. [llama.cpp benchmarks](https://github.com/ggerganov/llama.cpp/discussions/4167)

**Implementations.** The llama.cpp project (Gerganov) is the dominant open-source implementation for CPU/GPU local inference, supporting GGUF format across macOS, Linux, Windows, iOS, and Android. The Hugging Face Transformers library integrates GPTQ via the auto-gptq package and AWQ via the autoawq package, primarily targeting GPU inference. Ollama provides a user-friendly wrapper around llama.cpp for macOS and Linux, abstracting model management and quantization selection. LM Studio offers a GUI-based interface for downloading and running quantized models locally. On mobile, llama.cpp has been ported to iOS (via Swift bindings) and Android (via JNI), while Google's MediaPipe LLM Inference API provides a higher-level abstraction for on-device model execution. [Ollama](https://ollama.com) [LM Studio](https://lmstudio.ai)

**Strengths and limitations.** PTQ methods enable immediate deployment of existing models on consumer hardware without retraining, and the GGUF ecosystem provides a remarkably complete solution from model conversion through interactive serving. The primary limitation is quality: at aggressive quantization levels (2-3 bit) or with small models (under 3B parameters), quantization error can degrade outputs noticeably, particularly on tasks requiring precise numerical reasoning, code generation with strict syntactic requirements, or multi-step logical inference. Additionally, PTQ cannot recover from training-time distributional issues — if the original model performs poorly on a task, quantization cannot improve it. Finally, the quantization ecosystem remains fragmented: GPTQ, AWQ, and GGUF models are not interchangeable without reconversion, creating practical friction for users navigating the landscape.

### 4.2 Quantization-Aware Training and Parameter-Efficient Fine-Tuning: QLoRA (Approach B)

**Theory and mechanism.** QLoRA (Dettmers et al. 2023) combines two techniques: 4-bit NormalFloat quantization of the base model with Low-Rank Adaptation (LoRA) training of small adapter matrices at higher precision. The base model's weights are frozen in 4-bit quantized form, and trainable low-rank matrices (typically rank 8-64) are added to attention projection layers. During the forward pass, quantized base weights are dequantized on the fly and combined with the adapter contributions; during the backward pass, only the adapter gradients are computed and updated. This reduces the memory required for fine-tuning a 65B model from over 780 GB (full fine-tuning at FP16) to under 48 GB, making it feasible on a single consumer GPU or Apple Silicon MacBook. [Dettmers et al. 2023](https://arxiv.org/abs/2305.14314)

The NormalFloat (NF4) data type used by QLoRA is information-theoretically optimal for normally distributed weights: it assigns quantization levels to equal-area regions under the standard normal distribution, maximizing expected precision for the empirical weight distributions observed in transformer models. Combined with double quantization (quantizing the quantization constants themselves), this achieves 4-bit precision with less than 0.4 bits of overhead per parameter for quantization metadata. [Dettmers et al. 2023](https://arxiv.org/abs/2305.14314)

**Evidence and benchmarks.** QLoRA fine-tuning on the Guanaco dataset demonstrated that a 4-bit quantized 65B Llama model fine-tuned with QLoRA achieved 99.3% of the performance of full-precision ChatGPT on the Vicuna benchmark, as evaluated by GPT-4. On more rigorous evaluations (MMLU, ARC, HellaSwag), QLoRA fine-tuned models showed performance within 1-2% of full 16-bit fine-tuned equivalents. The practical significance is that a user with a 48 GB Apple M-series MacBook can fine-tune a 33B model, or a user with a single 24 GB GPU (RTX 4090) can fine-tune a 13B model, using their own private data. [Dettmers et al. 2023](https://arxiv.org/abs/2305.14314)

Subsequent work has extended the QLoRA approach. The PEFT (Parameter-Efficient Fine-Tuning) library from Hugging Face generalizes LoRA, QLoRA, and related methods (prefix tuning, p-tuning, IA3) into a unified framework. Experiments comparing adapter methods show that LoRA and QLoRA generally outperform prefix tuning and prompt tuning on instruction-following tasks, while using 10-100x fewer trainable parameters than full fine-tuning. [Hu et al. 2021](https://arxiv.org/abs/2106.09685)

**Implementations.** The Hugging Face Transformers + PEFT + bitsandbytes stack is the canonical implementation path: bitsandbytes provides the NF4 quantization kernel, PEFT manages adapter configuration and merging, and Transformers provides the model and training loop. The Axolotl framework wraps this stack for streamlined fine-tuning configuration. On Apple Silicon, MLX provides native QLoRA support through the mlx-lm library, with fine-tuning performance competitive with CUDA on equivalent workloads due to unified memory eliminating CPU-GPU data transfers. Unsloth further optimizes LoRA/QLoRA fine-tuning by rewriting attention kernels to reduce memory usage by an additional 50-70%, enabling 70B fine-tuning in under 48 GB. [MLX](https://github.com/ml-explore/mlx)

**Strengths and limitations.** QLoRA democratizes fine-tuning by bringing it within reach of consumer hardware budgets. The adapter architecture also supports multiple specialized adaptations of a single base model (one for coding, one for writing, one for domain-specific knowledge) without duplicating the base model's memory footprint. Limitations include: adapters add inference latency (typically 5-10%) unless merged into the base weights, which requires converting back to a higher precision temporarily; QLoRA fine-tuning still requires several hours for meaningful adaptation even on fast hardware; and the quality ceiling is bounded by the base model's capabilities — no amount of fine-tuning can teach a 7B model capabilities that require 70B-scale representation capacity. The rank of the adapter also bounds the expressiveness of the adaptation: very low ranks (4-8) may underfit complex domains, while higher ranks (64-128) approach the memory cost that QLoRA was designed to avoid.

### 4.3 Framework-Optimized On-Device Inference: MLX, ExecuTorch, and MLC-LLM (Approach C)

**Theory and mechanism.** General-purpose inference engines like llama.cpp prioritize portability across hardware platforms. Framework-optimized engines instead exploit specific hardware capabilities — instruction sets, memory hierarchies, accelerator architectures — to maximize throughput on targeted platforms. This approach trades portability for performance, often achieving 2-5x speedups on supported hardware. [Apple MLX 2023](https://github.com/ml-explore/mlx)

Apple MLX (2023-present) is a NumPy-like array framework designed explicitly for Apple Silicon's unified memory architecture. Its key innovation is lazy evaluation with unified memory: operations are recorded as a computation graph and executed only when results are needed, with tensors residing in a single memory pool accessible to CPU, GPU, and Neural Engine without copies. For LLM inference, this means the entire model can reside in unified memory and be accessed by the GPU for matrix multiplications without the PCIe transfer bottleneck that limits discrete GPU systems. MLX's transformer implementation includes optimized attention kernels, KV-cache management, and quantization support (4-bit and 8-bit), achieving token generation rates that are competitive with or exceed llama.cpp on equivalent Apple Silicon hardware, particularly for larger models where memory bandwidth is the bottleneck. [Awni Hannun et al. 2023](https://github.com/ml-explore/mlx)

ExecuTorch (Meta, 2023-present) targets mobile and embedded deployment of PyTorch models. It separates model export (via torch.export to produce a portable intermediate representation) from runtime execution (via a lightweight C++ runtime with pluggable backends). Backends exist for Apple CoreML/Metal, Qualcomm QNN, ARM XNNPACK, and Vulkan, enabling a single model export to run optimized on diverse mobile hardware. ExecuTorch specifically addresses the memory constraints of mobile devices through operator fusion, memory planning (preallocating tensor buffers to avoid runtime allocation), and delegated execution where performance-critical subgraphs are offloaded to hardware accelerators. [Meta 2023](https://pytorch.org/executorch/)

MLC-LLM (Machine Learning Compilation for LLMs, Chen et al. 2023) uses the Apache TVM compiler framework to generate hardware-specific kernels for LLM inference. The key idea is that the same high-level model definition (in the Relax IR) can be compiled to optimized kernels for CUDA, Metal, Vulkan, OpenCL, and WebGPU, with each backend receiving target-specific optimizations including operator fusion, memory layout transformation, and vectorized instruction selection. MLC-LLM has demonstrated LLM inference on iPhone, Android, and web browsers (via WebGPU), with the same model running across all platforms from a single compilation pipeline. [Chen et al. 2023](https://arxiv.org/abs/2306.00978)

**Evidence and benchmarks.** Comparative benchmarks on Apple M2 Ultra show MLX achieving 45-80 tokens per second for Llama 2 7B (4-bit), compared to 30-55 for llama.cpp with Metal acceleration, a 30-50% advantage attributable to MLX's optimized memory access patterns and kernel implementations. The gap narrows for larger models where memory bandwidth (rather than compute) is the bottleneck. On mobile, MLC-LLM achieves 10-20 tokens per second for 3B-parameter models on flagship Android devices (Snapdragon 8 Gen 3), comparable to ExecuTorch with QNN backend. Web browser inference via MLC-LLM's WebGPU backend achieves 5-15 tokens per second for sub-3B models, limited by WebGPU's current maturity and the overhead of running within a browser sandbox.

CoreML optimizations for on-device inference on iOS and macOS deserve specific attention. Apple's CoreML framework provides a high-level interface that automatically leverages the Neural Engine, GPU, and CPU based on the model's computational graph. For transformer models, CoreML's stateful prediction API (introduced in 2024) enables efficient KV-cache management across sequential generation steps, avoiding the overhead of reconstructing state on each invocation. Models converted to CoreML format via coremltools achieve 2-4x speedups over unoptimized PyTorch execution on the same hardware, primarily from Neural Engine delegation of attention computations and MPS (Metal Performance Shaders) acceleration of matrix multiplications.

**Strengths and limitations.** Framework-optimized engines extract maximum performance from specific hardware, which matters for interactive applications where token generation latency directly affects user experience. The primary limitation is ecosystem fragmentation: MLX targets only Apple Silicon, ExecuTorch requires model re-export for each backend, and MLC-LLM requires compilation per target. A model optimized for one framework cannot be directly used with another. Additionally, these frameworks lag behind llama.cpp in model format support — new model architectures (e.g., Mixture of Experts, novel attention patterns) typically appear first in llama.cpp's GGUF ecosystem before being supported by platform-specific frameworks. The pace of development is rapid across all frameworks, with API stability remaining a practical concern for production applications.

### 4.4 Federated Learning for Personal Devices (Approach D)

**Theory and mechanism.** Federated learning (FL) enables model training across a distributed fleet of devices without centralizing raw data. In the canonical formulation (McMahan et al. 2017, FedAvg), a coordination server distributes a global model to participating devices, each device trains on its local data for several epochs, local model updates (gradients or weight differences) are transmitted back to the server, and the server aggregates updates to produce an improved global model. The process repeats for multiple rounds. No raw data leaves any device; only model updates are shared. [McMahan et al. 2017](https://arxiv.org/abs/1602.05629)

The application to personal devices introduces specific challenges beyond standard FL research. Device heterogeneity is extreme: a fleet of personal devices may include smartphones with 4-8 GB RAM, laptops with 16-64 GB, and tablets with varying computational capability, creating non-trivial system heterogeneity in training capacity, network bandwidth, and availability windows. Data heterogeneity (non-IID distributions) is similarly extreme: each user's data reflects their unique vocabulary, topics of interest, writing style, and usage patterns, deviating substantially from any global distribution. [Kairouz et al. 2021](https://arxiv.org/abs/1912.04977)

Several FL variants address these challenges. FedProx (Li et al. 2020) adds a proximal regularization term to local objectives to limit divergence from the global model, improving convergence under data heterogeneity. FedMA (Wang et al. 2020) performs model matching before averaging, aligning neurons with similar functionality across local models to avoid destructive interference. Personalized FL methods (Per-FedAvg, pFedMe, FedPer) maintain both a global model and per-device personalizations, enabling each device to benefit from collective learning while retaining task-specific adaptations. [Li et al. 2020](https://arxiv.org/abs/1812.06127)

**Evidence and benchmarks.** Google's deployment of federated learning for Gboard next-word prediction (2017-present) represents the most extensively documented production FL system on personal devices. The system trains on typed text from millions of devices without collecting raw keystrokes, using secure aggregation to prevent the server from observing individual updates. Reported results show federated models matching or exceeding server-trained models on next-word prediction accuracy, with communication costs of approximately 1.5 MB per round per device for a recurrent language model. Apple's analogous system for keyboard prediction and QuickType uses on-device training with differential privacy, publishing aggregate privacy parameters (epsilon values) in technical documentation. [Hard et al. 2018](https://arxiv.org/abs/1811.03604)

For larger language models, federated fine-tuning (rather than training from scratch) is the practical approach. Recent work on federated instruction tuning demonstrates that LoRA adapters can be federated effectively: each device fine-tunes a low-rank adapter on its local data, adapter weights are aggregated on a server (with optional DP noise addition), and the aggregated adapter is distributed back. This reduces communication costs from the full model size to the adapter size (typically 0.1-1% of total parameters). [Zhang et al. 2023](https://arxiv.org/abs/2305.05644)

**Implementations.** Flower (Beutel et al. 2020) is the most widely used open-source FL framework, supporting PyTorch, TensorFlow, and JAX backends with pluggable aggregation strategies. PySyft (OpenMined) provides FL with an emphasis on privacy primitives, including secure aggregation and differential privacy. Apple's Create ML and Core ML frameworks support on-device model personalization, though not full FL — they enable local fine-tuning without aggregation. Google's TensorFlow Federated provides simulation tools and production FL infrastructure integrated with Android. For LLM-specific federated fine-tuning, the OpenFedLLM project (2024) demonstrates federated instruction tuning of 7B models using LoRA across heterogeneous devices. [Beutel et al. 2020](https://arxiv.org/abs/2007.14390)

**Strengths and limitations.** Federated learning enables collaborative model improvement without data centralization, which is particularly valuable for personal devices where users are unwilling to share raw data. The approach benefits from the statistical power of large user populations while respecting data locality. Limitations are substantial: communication overhead remains significant even with gradient compression and sparse updates; convergence is slower and less predictable than centralized training, especially under severe data heterogeneity; the coordination server, while not receiving raw data, still represents a single point of failure and a trust assumption (it could distribute malicious models or infer information from update patterns); and FL for LLMs remains largely experimental, with production deployments limited to smaller models (next-word prediction, emoji suggestion) rather than general-purpose language models.

### 4.5 On-Device Fine-Tuning with Differential Privacy (Approach E)

**Theory and mechanism.** When on-device fine-tuning produces model updates that will be shared (whether through federated learning, cloud backup, or device migration), differential privacy provides formal bounds on information leakage. DP-SGD (Abadi et al. 2016) modifies stochastic gradient descent by two operations: per-sample gradient clipping (bounding the L2 norm of each training example's gradient contribution to a threshold C) and Gaussian noise addition (adding noise proportional to C * sigma / batch_size to the aggregated gradient, where sigma is calibrated to achieve the desired privacy guarantee). The resulting mechanism satisfies (epsilon, delta)-DP, where epsilon and delta depend on the noise scale, the number of training steps, the sampling rate, and the composition theorem applied (typically the moments accountant or Renyi DP composition). [Abadi et al. 2016](https://arxiv.org/abs/1607.00133)

In the local-first context, the relevant threat model is: an adversary who obtains the fine-tuned model weights (or the difference between fine-tuned and base model weights) attempts to determine whether a specific data point was in the fine-tuning set (membership inference) or to reconstruct training examples (data extraction). DP-SGD bounds the success probability of such attacks regardless of the adversary's computational power or auxiliary information. The privacy budget (epsilon) represents the maximum information leakage: epsilon = 1 provides strong privacy (roughly, any single training example changes the output distribution by at most a factor of e), while epsilon = 10 provides weaker but still meaningful bounds against specific attack classes.

**Evidence and benchmarks.** Empirical results on DP fine-tuning of language models show a consistent quality-privacy trade-off. Li et al. (2022, "Large Language Models Can Be Strong Differentially Private Learners") demonstrated that fine-tuning large pre-trained models with DP-SGD achieves much better privacy-utility trade-offs than training from scratch, because the pre-trained weights already encode general language knowledge and the fine-tuning step needs to learn only task-specific adaptations, reducing the number of gradient steps (and thus the privacy budget consumed). For GPT-2 scale models fine-tuned on classification tasks, epsilon = 3 achieved accuracy within 2-5% of non-private fine-tuning. For generation tasks, the degradation is larger, particularly for low epsilon values, manifesting as increased repetition and reduced diversity. [Li et al. 2022](https://arxiv.org/abs/2110.05679)

Yu et al. (2023) showed that combining DP-SGD with LoRA adapters further improves the privacy-utility trade-off, because the low-rank constraint acts as an implicit regularizer that reduces the effective dimensionality of the optimization problem, allowing the same privacy budget to produce better-quality models. This finding is directly relevant to local-first systems where QLoRA fine-tuning is already the preferred approach for memory efficiency: the privacy guarantee comes at minimal additional cost when adapter-based fine-tuning is already in use. [Yu et al. 2022](https://arxiv.org/abs/2210.00038)

**Implementations.** Opacus (Meta) provides the canonical implementation of DP-SGD for PyTorch, with per-sample gradient computation via vmap, automatic privacy accounting via the RDP (Renyi Differential Privacy) accountant, and support for common model architectures. Google's dp-transformers library extends this to Hugging Face Transformers with DP-compatible training loops. TensorFlow Privacy provides equivalent functionality for TensorFlow models. For on-device contexts, the Flower FL framework integrates with Opacus to provide federated DP fine-tuning. Apple's on-device learning framework applies differential privacy internally (with published epsilon bounds) to keyboard and Siri improvements, though the implementation is not open-source.

**Strengths and limitations.** DP fine-tuning provides the only known approach for formally bounding information leakage from shared model updates, which is essential when fine-tuned models or adapters cross trust boundaries (even across a user's own devices, if those devices have different security postures). The approach composes with federated learning, enabling privacy-preserving collaborative model improvement. Limitations include: significant quality degradation at strong privacy levels (epsilon < 1) for generation tasks; computational overhead of per-sample gradient clipping (1.5-3x slowdown compared to standard training); difficulty in selecting meaningful epsilon values without domain-specific calibration; and the fundamental limitation that DP protects against information leakage from model updates but not from the model's inference behavior — a locally fine-tuned model used only for local inference does not need DP, because the model never crosses a trust boundary.

### 4.6 Local Vector Databases and Embedding Search (Approach F)

**Theory and mechanism.** Semantic search over personal data requires two components: an embedding model that maps text (or other data) to dense vector representations capturing semantic similarity, and a vector index that enables efficient approximate nearest neighbor (ANN) search over these embeddings. In a local-first architecture, both components run entirely on-device, with embeddings stored in a local database and similarity search executed without network access. [Johnson et al. 2019](https://arxiv.org/abs/1702.08734)

Embedding models suitable for on-device use have converged around the 30-150 million parameter range, producing 384-1024 dimensional vectors. Models like all-MiniLM-L6-v2 (22M parameters, 384 dimensions), nomic-embed-text (137M parameters, 768 dimensions), and BGE-small-en (33M parameters, 384 dimensions) achieve competitive performance on the MTEB (Massive Text Embedding Benchmark) while running at hundreds of embeddings per second on laptop CPUs. For specialized domains, fine-tuned variants improve retrieval quality without increasing computational cost. The ONNX Runtime provides a portable execution engine that runs these models across CPU, GPU, and NPU backends. [Muennighoff et al. 2023](https://arxiv.org/abs/2210.07316)

Vector indexing for on-device use requires algorithms that balance search accuracy, query latency, memory usage, and index build time. The dominant approaches are:

- **HNSW (Hierarchical Navigable Small World)**: A graph-based index providing high recall (>95% at reasonable parameter settings) with logarithmic search complexity. Memory overhead is approximately 1.5-2x the raw vector storage. Suitable for collections up to several million vectors on consumer hardware.
- **IVF (Inverted File Index)**: Partitions vectors into clusters and searches only the nearest clusters at query time. Lower memory overhead than HNSW but typically lower recall for the same query latency.
- **Flat (brute-force)**: Exact nearest neighbor search by scanning all vectors. Optimal for small collections (under 50,000 vectors) where index construction overhead exceeds brute-force search cost.

[Malkov & Yashunin 2018](https://arxiv.org/abs/1603.09320)

**Evidence and benchmarks.** SQLite-vec (Alex Garcia, 2024) extends SQLite with vector similarity search, storing embeddings as BLOBs in regular SQLite tables and supporting brute-force and IVF indexing. Benchmarks show query latencies under 10ms for brute-force search over 100,000 768-dimensional vectors on a laptop CPU, scaling linearly with collection size. For larger collections, IVF indexing reduces query time at the cost of recall (typically 90-95% recall at 10x speedup). The SQLite integration is significant because SQLite is the most widely deployed database engine, available on every major platform including iOS and Android, making it a natural substrate for local-first applications. [Garcia 2024](https://github.com/asg017/sqlite-vec)

LanceDB (2023-present) provides an embedded vector database built on the Lance columnar format, designed for local-first applications. It supports HNSW indexing, automatic quantization of vectors (product quantization, scalar quantization), and hybrid search combining vector similarity with metadata filtering. LanceDB operates as an embedded library (no server process), making it suitable for desktop and mobile applications. Benchmarks show sub-millisecond query latency for HNSW search over 1 million vectors on laptop hardware.

Chroma (2023-present) provides an embedding database with a focus on simplicity for RAG (Retrieval-Augmented Generation) applications. It runs as an embedded library or lightweight server, supports HNSW indexing via hnswlib, and includes built-in embedding function integration. For local-first use, Chroma's embedded mode stores all data in a local directory with no external dependencies. [Chroma](https://github.com/chroma-core/chroma)

FAISS (Facebook AI Similarity Search, Johnson et al. 2019) is the most mature vector search library, supporting GPU-accelerated indexing and a comprehensive set of index types. While originally designed for server deployment, FAISS's C++ core compiles for mobile platforms, and Python bindings enable desktop use. Its IVF-PQ (Product Quantization) index is particularly suited to memory-constrained environments, reducing per-vector memory from 3072 bytes (768 dimensions x 4 bytes) to as little as 64-128 bytes with moderate recall loss. [Johnson et al. 2019](https://arxiv.org/abs/1702.08734)

**Strengths and limitations.** Local vector databases enable semantic search over personal data with zero cloud dependency, sub-second latency, and no data exfiltration risk. The embedding + ANN search paradigm is well-understood, with mature implementations available for every platform. Limitations include: embedding models capture semantic similarity but not logical relationships, causal structure, or temporal ordering, limiting the types of queries that can be answered; embedding quality degrades for domains not well-represented in the embedding model's training data (e.g., highly personal vocabulary, domain jargon, non-English content for English-centric models); vector databases require re-embedding when the embedding model changes, creating a maintenance burden; and the total storage overhead (original data + embeddings + index structures) can be 2-5x the raw data size, which is non-trivial for large personal collections.

### 4.7 Personal Knowledge Graphs (Approach G)

**Theory and mechanism.** Knowledge graphs represent information as typed entities connected by typed relations, forming a graph structure that supports traversal, pattern matching, and logical inference. In the personal knowledge graph context, entities correspond to people, documents, events, topics, and locations in a user's life, and relations capture connections such as "authored by," "discussed in meeting on," "related to project," and "mentioned alongside." Unlike vector embeddings, which capture statistical co-occurrence patterns, knowledge graphs capture explicit semantic relationships that support multi-hop reasoning and structured queries. [Hogan et al. 2021](https://arxiv.org/abs/2003.02320)

The construction of personal knowledge graphs from unstructured data (emails, notes, documents) requires named entity recognition (NER), relation extraction, coreference resolution, and temporal grounding. On-device NER models (spaCy's small/medium models at 12-40 MB, or ONNX-exported transformer NER at 50-150 MB) can process text at thousands of tokens per second on laptop hardware. Relation extraction is more challenging and typically relies on either rule-based patterns (dependency parse heuristics) or small transformer models fine-tuned for relation classification.

Graph storage on-device can use embedded graph databases (such as SQLite with a triple-store schema, or lightweight RDF stores like Oxigraph which compiles to WebAssembly and native targets) or property graph databases (like the embedded mode of Kuzu, which provides a columnar graph database designed for analytical queries). For small personal graphs (under 10 million triples), SQLite with appropriate indexing provides adequate query performance without the complexity of a dedicated graph engine.

**Evidence and benchmarks.** Apple's on-device knowledge graph powers Siri's entity resolution and contextual understanding, integrating contacts, calendar events, app usage, and location history into a unified graph that enables queries like "remind me about the email from Sarah about the project deadline." While Apple does not publish the graph's technical details, patent filings and WWDC presentations describe a system that performs entity linking, temporal reasoning, and cross-app relation extraction entirely on-device.

The Obsidian knowledge management application (2020-present) demonstrates a user-facing approach to personal knowledge graphs: bidirectional links between notes create an emergent graph structure that users can visualize and traverse. While Obsidian's graph is explicit (user-created links) rather than automatically extracted, its popularity (over 1 million users) validates the demand for structured personal knowledge navigation. AI-augmented extensions (Smart Connections, Copilot) add semantic search and suggested links, pointing toward a hybrid architecture combining explicit user-created structure with AI-extracted relations.

Research on automated personal knowledge graph construction (e.g., the PERKGE framework by Balog & Kenter, 2019) demonstrates that personal email archives can be automatically organized into entity-relation graphs with precision of 0.7-0.85 for entity extraction and 0.5-0.7 for relation extraction, depending on the complexity of relations attempted. These accuracy levels suggest that automated personal KG construction is viable for high-frequency, well-structured relations (person-organization affiliations, email communication patterns) but remains challenging for nuanced semantic relations (project dependencies, causal connections between events).

**Strengths and limitations.** Knowledge graphs provide structured, interpretable representations that support queries impossible with vector search alone ("Who did I discuss project X with in January?" requires entity resolution, temporal filtering, and relation traversal). Graph representations are compact for sparse relationships and support incremental updates without re-indexing the entire collection. Limitations include: automated construction from unstructured text remains error-prone, requiring either manual curation or tolerance for noise; graph schemas impose structure that may not match the user's mental model; scaling to millions of entities requires careful index design; and the "knowledge graph construction" bottleneck means that the graph is always a lossy, delayed reflection of the underlying data, never a complete substitute for full-text search over the original documents.

### 4.8 CRDTs and Local-First Synchronization (Approach H)

**Theory and mechanism.** Conflict-Free Replicated Data Types (CRDTs) are data structures that can be replicated across multiple devices and modified concurrently without coordination, with a mathematical guarantee that all replicas converge to the same state after exchanging updates. This convergence property — called strong eventual consistency — holds regardless of network partitions, message ordering, or the timing of synchronization events. CRDTs eliminate the need for consensus protocols, leader election, or conflict resolution heuristics, making them ideal for local-first applications where devices may be offline for extended periods. [Shapiro et al. 2011](https://hal.inria.fr/inria-00609399/document)

Two families of CRDTs exist. **State-based CRDTs** (CvRDTs) define a merge operation that combines any two replica states into a consistent merged state, with the requirement that the merge operation forms a join-semilattice (commutative, associative, idempotent). Synchronization consists of exchanging full states and merging. **Operation-based CRDTs** (CmRDTs) define operations that are commutative: applying the same set of operations in any order produces the same final state. Synchronization consists of exchanging operations, which is more bandwidth-efficient but requires exactly-once delivery guarantees. [Shapiro et al. 2011](https://hal.inria.fr/inria-00609399/document)

For local-first AI applications, CRDTs are relevant in several contexts:

- **Synchronizing personal knowledge bases across devices**: A user's notes, annotations, and AI-generated metadata should be consistent across their laptop, phone, and tablet, even when devices are offline.
- **Merging AI-generated content**: When multiple devices independently generate summaries, tags, or extracted entities from the same source document, CRDTs can merge these contributions without conflicts.
- **Collaborative personal AI**: When multiple users share a subset of their knowledge bases (e.g., a shared project), CRDTs enable concurrent local editing with guaranteed convergence.

**Evidence and benchmarks.** Automerge (Kleppmann et al. 2017-present) is the reference implementation of CRDTs for local-first software. It provides a JSON-like document model supporting nested objects, arrays, and rich text, with automatic conflict resolution. Automerge 2.0 (2023) introduced a binary document format that reduces storage overhead by 5-10x compared to the original implementation and supports incremental synchronization (exchanging only the operations since the last sync point rather than full document state). Performance benchmarks show that Automerge 2.0 can handle documents with millions of operations with sub-second merge times on laptop hardware, adequate for personal knowledge bases of substantial size. [Kleppmann & Beresford 2017](https://arxiv.org/abs/1608.03960)

Yjs (Nicolaescu et al. 2015-present) is an alternative CRDT implementation optimized for real-time collaborative editing. Yjs uses a YATA (Yet Another Transformation Approach) algorithm that provides a more compact representation of text operations than Automerge's original approach, with benchmarks showing 10-100x better performance for text-heavy documents. Yjs supports multiple persistence backends (IndexedDB for browsers, LevelDB for Node.js, SQLite via y-sqlite) and network transports (WebSocket, WebRTC, custom protocols). The Yjs ecosystem includes bindings for ProseMirror, CodeMirror, Monaco, Quill, and TipTap editors. [Nicolaescu et al. 2015](https://github.com/yjs/yjs)

The Ink & Switch research lab has published extensive case studies of CRDT-based local-first applications, including Pushpin (a collaborative corkboard), Pixelpusher (a collaborative pixel editor), and Peritext (a CRDT for rich text that preserves formatting intent across concurrent edits). These case studies document both the strengths of CRDTs (seamless offline operation, no data loss from concurrent edits) and practical challenges (document size growth from retained history, performance degradation for very large documents, UX challenges in presenting merged results to users). [Ink & Switch](https://www.inkandswitch.com/)

**Strengths and limitations.** CRDTs provide the only known mechanism for achieving strong eventual consistency without coordination, which is foundational for local-first software that must work offline and sync later. The mathematical guarantees (convergence, intention preservation for well-designed CRDTs) are provable properties, not heuristics. Limitations include: metadata overhead (CRDTs must retain enough history to merge correctly, which can be substantial for frequently modified documents); not all data structures have natural CRDT formulations (e.g., CRDTs for ordered sequences exist but are more complex than those for sets or counters); garbage collection of CRDT history is possible only when all replicas are known to have synchronized past a certain point, which is difficult in peer-to-peer topologies; and CRDTs guarantee convergence but not user intent — concurrent conflicting edits converge to a deterministic result that may not be what either user intended, requiring application-level conflict resolution UX.

### 4.9 Offline-First Application Architecture (Approach I)

**Theory and mechanism.** Offline-first architecture is a design philosophy in which network connectivity is treated as an enhancement rather than a requirement. Applications built on this principle store all data locally, perform all operations against local state, and synchronize with remote systems when connectivity is available. This inverts the conventional web application model where the server is the source of truth and the client is a cache. [Nicola & Fette 2011](https://tools.ietf.org/html/rfc6455)

The architectural patterns for offline-first applications include:

- **Local-first data layer**: Application state is stored in a local database (SQLite, IndexedDB, Core Data) that is the primary source of truth. All reads and writes target the local database, with sync occurring asynchronously.
- **Optimistic updates**: User actions are applied immediately to local state, with conflict resolution occurring during subsequent synchronization. The UI never blocks on network operations.
- **Service workers and background sync**: In web applications, service workers intercept network requests and serve responses from a local cache, enabling full offline operation. The Background Sync API queues updates for delivery when connectivity resumes.
- **Event sourcing with local log**: Operations are recorded as an append-only local event log, which is replayed to reconstruct state and can be synchronized with remote logs. This pattern supports undo/redo, audit trails, and conflict resolution.
- **Sync engines**: Dedicated middleware (PowerSync, ElectricSQL, Triplit, CR-SQLite, Evolu) manages bidirectional synchronization between local databases and remote servers, handling conflict detection, resolution, and incremental sync. [Kinto 2016](https://docs.kinto-storage.org)

**Evidence and benchmarks.** The local-first architecture has seen substantial adoption in 2024-2025. PowerSync provides a synchronization layer between local SQLite databases and PostgreSQL backends, using a last-write-wins conflict resolution strategy with configurable merge rules. It supports React Native, Flutter, and web applications, enabling the same local-first architecture across mobile and desktop platforms. ElectricSQL implements a subset of CRDTs atop PostgreSQL's logical replication, enabling active-active sync between a server PostgreSQL and local SQLite databases. CR-SQLite (Vulcan Labs) adds CRDT semantics directly to SQLite tables, enabling merge-without-conflict synchronization at the database level.

Evolu (2023-present) provides a local-first framework specifically designed for privacy-sensitive applications. It combines SQLite (via CRDT-enhanced cr-sqlite), end-to-end encryption, and Merkle-tree-based synchronization, with the explicit design goal that the sync server can never read user data. Evolu's architecture demonstrates the complete local-first stack: data is encrypted on-device before sync, the server stores only encrypted blobs and sync metadata, and decryption occurs only on the user's devices.

Linear (the project management tool) has documented its local-first architecture extensively, demonstrating that complex collaborative applications with real-time synchronization can be built on local-first principles at production scale. Linear's sync engine maintains a local operation log, applies operations optimistically, and resolves conflicts via a deterministic merge algorithm. Users report sub-100ms response times for all interactions, regardless of network conditions.

**Strengths and limitations.** Offline-first architecture eliminates the user-facing symptoms of network dependency: no loading spinners, no lost work from disconnection, no degraded functionality during travel or in areas with poor connectivity. For AI applications, it means queries against local models and knowledge bases respond instantly regardless of network state. Limitations include: increased application complexity from managing local state, sync, and conflict resolution; storage constraints on mobile devices (particularly iOS, where the OS may evict large local databases under storage pressure); testing complexity from the need to validate behavior under various connectivity scenarios (offline, slow, intermittent, reconnecting); and the unsolved problem of deterministic merge for all data types — some application state (e.g., finite resources, unique constraints) cannot be merged without coordination, requiring application-specific conflict resolution logic.

### 4.10 Privacy-Preserving Personal AI Assistants: The "Private Brain" (Approach J)

**Theory and mechanism.** The "private brain" concept integrates multiple approach families into a unified system: a personal AI assistant with comprehensive access to a user's digital life that runs entirely on-device and never transmits raw personal data to external servers. This requires combining on-device inference (Approaches A-C), local knowledge organization (Approaches F-G), local-first architecture (Approaches H-I), and a carefully designed security architecture that maintains privacy guarantees even as the system's capabilities expand. [Mireshghallah et al. 2024](https://arxiv.org/abs/2310.10383)

The architectural components of a private brain system include:

1. **Ingestion pipeline**: Processes incoming data (emails, documents, messages, calendar events, financial transactions) through on-device NLP to extract entities, relations, embeddings, and summaries. All processing occurs locally; raw data never leaves the device.
2. **Local knowledge store**: Combines a vector database for semantic search, a knowledge graph for structured queries, and a full-text index for exact retrieval. The knowledge store is the system's "memory" — queryable, updatable, and entirely on-device.
3. **Local inference engine**: Runs a quantized language model capable of understanding natural language queries, reasoning over retrieved context, and generating coherent responses. The model is the system's "intelligence" — it interprets queries, orchestrates retrieval, and synthesizes answers.
4. **Orchestration layer**: Manages the interaction between query understanding, retrieval, reasoning, and response generation. Implements RAG (Retrieval-Augmented Generation) patterns locally: the model formulates retrieval queries, the knowledge store returns relevant context, and the model generates an answer grounded in that context.
5. **Security boundary**: Enforces the guarantee that no raw personal data crosses the device boundary. This requires careful handling of all system interfaces: model updates, crash reports, usage analytics, and sync metadata must be designed to not leak personal information.

**Evidence and benchmarks.** Several production and research systems approximate the private brain architecture:

Rewind.ai (now Limitless, 2023-present) records screen content, audio, and application activity on macOS, storing everything locally and providing AI-powered search and summarization over the recorded data. While Rewind uses cloud models for some inference, the recording and storage are local, and the system demonstrates the ingestion pipeline component at scale — capturing and indexing a continuous stream of personal digital activity.

Apple Intelligence (2024-present) implements substantial on-device AI capabilities including text summarization, email prioritization, image generation, and Writing Tools, with a "Private Cloud Compute" architecture for queries that exceed on-device model capacity. Apple's security architecture is notable for its transparency: queries routed to cloud processing use dedicated servers with no persistent storage, cryptographic attestation of server software, and published security guarantees. The on-device models (reportedly 3B-parameter transformers optimized for Apple Silicon) handle the majority of tasks without any cloud involvement.

Khoj (2023-present) is an open-source self-hosted AI assistant that indexes personal notes (Obsidian, Org-mode, plaintext), documents, and GitHub repositories, providing natural language search and chat grounded in the user's data. Khoj runs locally using llama.cpp for inference and a local vector database for retrieval, implementing a complete RAG pipeline without cloud dependencies.

Private-GPT (2023-present) provides a local RAG system for document question-answering, using llama.cpp for inference and local embedding models for document indexing. It processes PDF, DOCX, and text files entirely on-device, with no data transmitted externally. While simpler than a full private brain, it demonstrates the core architecture of local model + local knowledge store + local RAG orchestration.

**Threat model and security considerations.** The security analysis for a private brain system must consider multiple threat vectors:

- **Data at rest**: Personal data stored on-device must be protected by full-disk encryption (FileVault, BitLocker, LUKS) and application-level encryption for sensitive data classes. The knowledge store (embeddings, knowledge graph, full-text index) contains derived representations of personal data and requires equivalent protection.
- **Data in transit**: If the system synchronizes across devices, sync traffic must be end-to-end encrypted with forward secrecy. The sync server (if any) should be unable to decrypt the data, operating only on encrypted blobs.
- **Model as information channel**: A fine-tuned model encodes information about its fine-tuning data in its weights. If the model or its adapters are shared (even with the user's other devices), this creates an information channel that may require DP protection (Approach E).
- **Side channels**: Query patterns, timing information, embedding similarity queries, and model token probabilities can all leak information about underlying data. A comprehensive threat model must address these channels, not just the raw data.
- **Physical access**: If an adversary gains physical access to the device, the system should provide no more access to personal data than the device's native encryption and authentication mechanisms allow.
- **Supply chain**: The base model, embedding model, and application code are external dependencies that could be compromised to exfiltrate data. Verification of model integrity (checksums, signed distributions) and sandboxed execution (restricting network access for inference processes) mitigate this vector.

**Strengths and limitations.** The private brain architecture offers the strongest possible privacy guarantee for a comprehensive personal AI assistant: when no personal data leaves the device, the attack surface for remote data exfiltration is eliminated entirely. The system is fully functional offline, responsive without network latency, and under the user's complete control. Limitations are correspondingly significant: on-device model quality is lower than cloud-hosted frontier models, limiting the complexity of tasks the system can perform well; the ingestion pipeline must handle diverse data formats and sources without the benefit of cloud-scale processing infrastructure; storage requirements for comprehensive personal indexing (embeddings + knowledge graph + full-text index + raw data) can be substantial (50-500 GB for a decade of digital activity); and the user bears full responsibility for backups, security updates, and system maintenance, without the operational support that cloud services provide implicitly.

---

## 5. Comparative Synthesis

### 5.1 Cross-Cutting Trade-Off Analysis

The ten approaches analyzed above can be compared along five orthogonal axes: model quality, computational cost, privacy guarantee strength, offline capability, and implementation maturity. Table 2 presents this comparison.

**Table 2. Comparative synthesis of local-first AI approaches**

| Approach | Model Quality | Compute Cost | Privacy Guarantee | Offline Capable | Implementation Maturity |
|----------|--------------|-------------|-------------------|----------------|------------------------|
| A. PTQ (GPTQ/AWQ/GGUF) | 85-97% of FP16 at 4-bit | Low (CPU inference feasible) | Absolute (no data leaves device) | Full | High (llama.cpp, Ollama) |
| B. QLoRA fine-tuning | 95-99% of full fine-tuning | Medium (backprop required) | Absolute if local-only; DP if shared | Full (training and inference) | High (PEFT, Unsloth, MLX) |
| C. Framework-optimized inference | Same as A, 30-100% faster | Low (hardware-accelerated) | Absolute (no data leaves device) | Full | Medium (rapid API changes) |
| D. Federated learning | Variable (depends on convergence) | High (multi-round training) | Partial (updates may leak info) | Partial (requires periodic sync) | Medium (Flower, TFF) |
| E. DP fine-tuning | 80-98% of non-private (varies with epsilon) | High (per-sample gradients) | Formal (epsilon, delta)-DP | Full (training local) | Medium (Opacus) |
| F. Local vector databases | N/A (retrieval quality) | Low (embedding + ANN search) | Absolute (no data leaves device) | Full | High (SQLite-vec, Chroma) |
| G. Personal knowledge graphs | N/A (extraction quality 50-85%) | Medium (NER + relation extraction) | Absolute (no data leaves device) | Full | Low-Medium (research stage) |
| H. CRDTs | N/A (data structure) | Low (merge operations) | E2E encryption possible | Full (by design) | Medium-High (Automerge, Yjs) |
| I. Offline-first architecture | N/A (system design) | Low (local operations) | Depends on sync design | Full (by design) | Medium-High (growing ecosystem) |
| J. Private brain (integrated) | Bounded by on-device model | High (combined stack) | Strongest possible (no exfiltration) | Full | Low-Medium (early systems) |

### 5.2 The Quality-Privacy Frontier

A central tension in local-first AI is the trade-off between model quality and privacy guarantee strength. This can be understood as a frontier with four regimes:

1. **Cloud inference, no privacy**: Maximum model quality (frontier models with 100B+ parameters), but all user data is processed on remote servers. This represents the current default for most AI applications.
2. **Cloud inference with privacy mitigations**: Cloud models with input sanitization, encrypted inference (homomorphic encryption, secure enclaves), or differential privacy on outputs. Partial privacy improvement at modest quality cost.
3. **Local inference, no sharing**: Quantized models running on-device with no data exfiltration. Strong privacy (only physical access threats), but model quality bounded by on-device parameter count and quantization precision.
4. **Local inference with federated improvement**: On-device models improved through federated learning with DP guarantees. Collaborative quality improvement with formal privacy bounds, but complex implementation and weaker guarantees than pure local operation.

As of early 2026, the quality gap between regime 1 and regime 3 is narrowing but remains significant for complex reasoning tasks. A local 4-bit quantized 70B model on a high-end MacBook achieves roughly 70-80% of the performance of a frontier cloud model on challenging benchmarks (MMLU, HumanEval, MATH), while a local 7B model achieves 40-60%. For simpler tasks (text summarization, document Q&A, basic code completion, semantic search), local models are often adequate or indistinguishable from cloud alternatives.

### 5.3 Hardware-Capability Matrix

The practical viability of local-first AI depends critically on hardware. Table 3 maps device classes to achievable capabilities.

**Table 3. Hardware-capability matrix for local-first AI**

| Device Class | RAM/VRAM | Typical Model Size | Inference Speed | Capabilities |
|-------------|----------|-------------------|----------------|-------------|
| MacBook Pro M4 Max (128 GB) | 128 GB unified | 70B at 4-bit | 8-15 tok/s | Near-frontier quality; comprehensive private brain |
| MacBook Air M3 (24 GB) | 24 GB unified | 13B at 4-bit | 20-40 tok/s | Strong general assistant; full RAG pipeline |
| MacBook Air M3 (8 GB) | 8 GB unified | 3-7B at 4-bit | 25-50 tok/s | Basic assistant; summarization; search |
| iPhone 15 Pro (8 GB) | 6 GB usable for ML | 1-3B at 4-bit | 15-30 tok/s | Simple Q&A; classification; entity extraction |
| Android flagship (12 GB) | 8-10 GB usable for ML | 1-3B at 4-bit | 10-25 tok/s | Simple Q&A; classification; entity extraction |
| Raspberry Pi 5 (8 GB) | 8 GB | 3-7B at 4-bit | 3-8 tok/s | Slow but functional home server |

### 5.4 Storage and Indexing Overhead

A comprehensive private brain system requires substantial storage for derived data. Table 4 estimates storage requirements for a personal data collection of moderate size.

**Table 4. Estimated storage for indexing 100,000 personal documents (approximately 500 MB of raw text)**

| Component | Storage | Notes |
|-----------|---------|-------|
| Raw data | 500 MB | Original documents, emails, notes |
| Full-text index (SQLite FTS5) | 200-400 MB | Inverted index with position data |
| Embeddings (768-dim, float32) | 300 MB | 100K vectors at 3 KB each |
| HNSW index | 450-600 MB | 1.5-2x embedding storage |
| Knowledge graph (triples) | 50-200 MB | Depends on extraction density |
| Local LLM (7B, Q4_K_M) | 4.1 GB | GGUF format |
| Embedding model (all-MiniLM) | 80 MB | ONNX format |
| **Total** | **5.7-6.2 GB** | For 500 MB of raw text |

The 10-12x expansion from raw data to fully indexed system is a significant consideration for mobile devices but negligible for laptops with 256+ GB storage.

---

## 6. Open Problems and Gaps

### 6.1 The Small Model Quality Ceiling

The most fundamental open problem is that small models (under 10B parameters) exhibit substantially lower performance than frontier models on tasks requiring complex reasoning, long-range coherence, nuanced instruction following, and factual accuracy. Quantization can shrink large models to fit on consumer hardware, but the quality gap between a 4-bit 7B model and a full-precision 400B model remains large for hard tasks. Research on knowledge distillation, architecture-efficient designs (Mixture of Experts for inference efficiency), and improved training data curation is narrowing this gap, but it remains the primary limitation of local-first AI for general-purpose assistant applications.

### 6.2 Standardized On-Device Benchmarks

No widely accepted benchmark suite exists for evaluating LLM performance specifically on consumer hardware under realistic conditions (memory pressure from other applications, thermal throttling during sustained inference, battery impact on mobile devices). Existing benchmarks measure model quality in isolation; what practitioners need is a joint quality-speed-efficiency metric that accounts for the constraints of real-world on-device deployment. The absence of such benchmarks makes it difficult to compare approaches objectively.

### 6.3 Automated Personal Knowledge Graph Construction

Current NER and relation extraction models achieve adequate accuracy for high-frequency, well-structured relations but fail on the nuanced, context-dependent relationships that constitute much of personal knowledge. The absence of labeled datasets for personal knowledge (due to privacy constraints) creates a bootstrapping problem: training better extraction models requires data that the privacy motivation of the system prohibits centralizing. Federated learning for extraction model improvement is a potential solution but adds substantial complexity.

### 6.4 Cross-Device Synchronization for AI State

Synchronizing model weights, adapter parameters, embedding indices, and knowledge graphs across a user's device fleet raises unsolved problems. CRDTs work well for document-like data but have no natural formulation for neural network weights or high-dimensional vector indices. Current approaches either treat model state as opaque blobs (losing incremental sync efficiency) or restrict synchronization to specific components (e.g., syncing the knowledge base but not the model). A principled framework for multi-device AI state synchronization does not yet exist.

### 6.5 Privacy Guarantees for Compound Systems

Formal privacy analysis (differential privacy, information-theoretic bounds) is well-developed for individual mechanisms (a single query, a single model update) but less developed for compound systems that combine multiple models, retrieval pipelines, and user interaction loops. A private brain system that runs a language model over retrieved personal context, stores the interaction in a local log, and uses that log to improve future retrieval creates a feedback loop whose privacy properties are not captured by the DP analysis of any individual component. Compositional privacy analysis for integrated local AI systems is an open theoretical challenge.

### 6.6 Usability and Maintenance Burden

Local-first systems transfer operational responsibility from service providers to users. Model updates, security patches, storage management, backup, and performance tuning become user responsibilities. For non-technical users, this maintenance burden may exceed the privacy benefit. Research on auto-updating model management, self-healing local indices, and zero-configuration local AI stacks is nascent but necessary for mainstream adoption.

### 6.7 Energy and Thermal Constraints

On mobile devices, sustained AI inference generates significant heat and drains batteries rapidly. An always-on private brain that continuously indexes incoming data and responds to queries may be impractical on battery-powered devices without substantial optimization or delegation of background processing to low-power cores. The interaction between model inference patterns and device thermal/power management is poorly characterized in the research literature.

### 6.8 Legal and Regulatory Uncertainty

The legal status of on-device AI processing is context-dependent and evolving. In some jurisdictions, on-device processing of employer-provided data may still constitute "processing" under data protection regulations, with the device owner (not the employer) potentially becoming a data controller. The regulatory implications of local-first AI for GDPR compliance, employment law, and data retention requirements remain unclear and represent a gap in the legal-technical interface.

---

## 7. Conclusion

Local-first AI has transitioned from an aspirational concept to a technically viable architecture for a meaningful subset of AI applications. The convergence of efficient quantization methods (GPTQ, AWQ, GGUF achieving 4-bit compression with modest quality loss), capable small language models (7B-70B parameter models approaching cloud-model quality on many tasks), hardware acceleration frameworks (MLX, ExecuTorch, CoreML exploiting dedicated neural processing units), and mature local-first infrastructure (CRDTs, embedded vector databases, offline-first design patterns) creates a stack sufficient for building personal AI assistants that function entirely without cloud dependency.

The ten approach families surveyed here occupy distinct positions in a multi-dimensional trade-off space spanning model quality, privacy guarantees, computational requirements, and implementation complexity. No single approach dominates across all axes. Post-training quantization provides the most accessible entry point, enabling immediate use of existing models on consumer hardware. QLoRA enables personal fine-tuning within consumer memory budgets. Local vector databases and knowledge graphs organize personal data for AI-augmented retrieval. CRDTs and offline-first architecture provide the synchronization and availability guarantees that make the system reliable across devices and connectivity states. Federated learning and differential privacy provide formal mechanisms for collaborative improvement without data centralization.

The open problems are substantial. The quality gap between local and cloud models remains significant for complex reasoning tasks. Standardized benchmarks for on-device AI do not exist. Automated personal knowledge graph construction is not reliable enough for unsupervised operation. Cross-device synchronization of AI state lacks a principled framework. And the compound privacy analysis of integrated local AI systems presents open theoretical challenges.

The trajectory, however, is clear. Model capability at small parameter counts is improving with each generation of base models. Hardware is becoming more capable (more TOPS, more unified memory, better thermal management). The local-first software ecosystem is maturing. The gap between cloud-dependent and local-first AI narrows with each iteration of these co-evolving technologies. The landscape surveyed here documents the current state of this convergence without predicting its endpoint.

---

## References

Abadi, M., Chu, A., Goodfellow, I., McMahan, H. B., Mironov, I., Talwar, K., & Zhang, L. (2016). Deep Learning with Differential Privacy. *Proceedings of the 2016 ACM SIGSAC Conference on Computer and Communications Security*. [https://arxiv.org/abs/1607.00133](https://arxiv.org/abs/1607.00133)

Apple. (2024). Core ML Documentation. Apple Developer. [https://developer.apple.com/machine-learning/core-ml/](https://developer.apple.com/machine-learning/core-ml/)

Beutel, D. J., Tober, T., Pillutla, K., et al. (2020). Flower: A Friendly Federated Learning Framework. *arXiv preprint arXiv:2007.14390*. [https://arxiv.org/abs/2007.14390](https://arxiv.org/abs/2007.14390)

Chen, T., Moreau, T., Jiang, Z., et al. (2023). MLC-LLM: Universal Deployment of Large Language Models. [https://github.com/mlc-ai/mlc-llm](https://github.com/mlc-ai/mlc-llm)

Dettmers, T., Lewis, M., Belkada, Y., & Zettlemoyer, L. (2022). LLM.int8(): 8-bit Matrix Multiplication for Transformers at Scale. *Advances in Neural Information Processing Systems 35*. [https://arxiv.org/abs/2208.07339](https://arxiv.org/abs/2208.07339)

Dettmers, T., Pagnoni, A., Holtzman, A., & Zettlemoyer, L. (2023). QLoRA: Efficient Finetuning of Quantized Language Models. *Advances in Neural Information Processing Systems 36*. [https://arxiv.org/abs/2305.14314](https://arxiv.org/abs/2305.14314)

Dwork, C. & Roth, A. (2014). The Algorithmic Foundations of Differential Privacy. *Foundations and Trends in Theoretical Computer Science*, 9(3-4), 211-407. [https://www.cis.upenn.edu/~aaroth/Papers/privacybook.pdf](https://www.cis.upenn.edu/~aaroth/Papers/privacybook.pdf)

Frantar, E., Ashkboos, S., Hoefler, T., & Alistarh, D. (2022). GPTQ: Accurate Post-Training Quantization for Generative Pre-Trained Transformers. *arXiv preprint arXiv:2210.17323*. [https://arxiv.org/abs/2210.17323](https://arxiv.org/abs/2210.17323)

Garcia, A. (2024). sqlite-vec: A vector search SQLite extension. [https://github.com/asg017/sqlite-vec](https://github.com/asg017/sqlite-vec)

Gerganov, G. (2023). llama.cpp: LLM inference in C/C++. [https://github.com/ggerganov/llama.cpp](https://github.com/ggerganov/llama.cpp)

Hannun, A., et al. (2023). MLX: An Array Framework for Apple Silicon. [https://github.com/ml-explore/mlx](https://github.com/ml-explore/mlx)

Hard, A., Rao, K., Mathews, R., et al. (2018). Federated Learning for Mobile Keyboard Prediction. *arXiv preprint arXiv:1811.03604*. [https://arxiv.org/abs/1811.03604](https://arxiv.org/abs/1811.03604)

Hogan, A., Blomqvist, E., Cochez, M., et al. (2021). Knowledge Graphs. *ACM Computing Surveys*, 54(4), 1-37. [https://arxiv.org/abs/2003.02320](https://arxiv.org/abs/2003.02320)

Howard, A. G., Zhu, M., Chen, B., et al. (2017). MobileNets: Efficient Convolutional Neural Networks for Mobile Vision Applications. *arXiv preprint arXiv:1704.04861*. [https://arxiv.org/abs/1704.04861](https://arxiv.org/abs/1704.04861)

Hu, E. J., Shen, Y., Wallis, P., et al. (2021). LoRA: Low-Rank Adaptation of Large Language Models. *arXiv preprint arXiv:2106.09685*. [https://arxiv.org/abs/2106.09685](https://arxiv.org/abs/2106.09685)

Johnson, J., Douze, M., & Jegou, H. (2019). Billion-scale similarity search with GPUs. *IEEE Transactions on Big Data*. [https://arxiv.org/abs/1702.08734](https://arxiv.org/abs/1702.08734)

Kairouz, P., McMahan, H. B., Avent, B., et al. (2021). Advances and Open Problems in Federated Learning. *Foundations and Trends in Machine Learning*, 14(1-2), 1-210. [https://arxiv.org/abs/1912.04977](https://arxiv.org/abs/1912.04977)

Kleppmann, M. & Beresford, A. R. (2017). A Conflict-Free Replicated JSON Datatype. *IEEE Transactions on Parallel and Distributed Systems*, 28(10), 2733-2746. [https://arxiv.org/abs/1608.03960](https://arxiv.org/abs/1608.03960)

Kleppmann, M., Wiggins, A., van Hardenberg, P., & McGranaghan, M. (2019). Local-First Software: You Own Your Data, in Spite of the Cloud. *Proceedings of the ACM SIGPLAN International Symposium on New Ideas, New Paradigms, and Reflections on Programming and Software (Onward!)*. [https://www.inkandswitch.com/local-first/](https://www.inkandswitch.com/local-first/)

Li, T., Sahu, A. K., Zaheer, M., et al. (2020). Federated Optimization in Heterogeneous Networks. *Proceedings of Machine Learning and Systems*. [https://arxiv.org/abs/1812.06127](https://arxiv.org/abs/1812.06127)

Li, X., Tramèr, F., Liang, P., & Hashimoto, T. (2022). Large Language Models Can Be Strong Differentially Private Learners. *ICLR 2022*. [https://arxiv.org/abs/2110.05679](https://arxiv.org/abs/2110.05679)

Lin, J., Tang, J., Tang, H., et al. (2023). AWQ: Activation-Aware Weight Quantization for LLM Compression and Acceleration. *arXiv preprint arXiv:2306.00978*. [https://arxiv.org/abs/2306.00978](https://arxiv.org/abs/2306.00978)

Malkov, Y. & Yashunin, D. (2018). Efficient and Robust Approximate Nearest Neighbor Search Using Hierarchical Navigable Small World Graphs. *IEEE Transactions on Pattern Analysis and Machine Intelligence*. [https://arxiv.org/abs/1603.09320](https://arxiv.org/abs/1603.09320)

McMahan, H. B., Moore, E., Ramage, D., et al. (2017). Communication-Efficient Learning of Deep Networks from Decentralized Data. *Proceedings of the 20th International Conference on Artificial Intelligence and Statistics*. [https://arxiv.org/abs/1602.05629](https://arxiv.org/abs/1602.05629)

Meta. (2023). ExecuTorch: End-to-End Solution for Enabling On-Device Inference. [https://pytorch.org/executorch/](https://pytorch.org/executorch/)

Mireshghallah, F., Goyal, S., Uniyal, A., Berg-Kirkpatrick, T., & Shokri, R. (2024). LLMs and Privacy: A Survey. *arXiv preprint arXiv:2310.10383*. [https://arxiv.org/abs/2310.10383](https://arxiv.org/abs/2310.10383)

Muennighoff, N., Tazi, N., Magne, L., & Reimers, N. (2023). MTEB: Massive Text Embedding Benchmark. *Proceedings of EACL 2023*. [https://arxiv.org/abs/2210.07316](https://arxiv.org/abs/2210.07316)

Nagel, M., Fournarakis, M., Amjad, R. A., et al. (2021). A White Paper on Neural Network Quantization. *arXiv preprint arXiv:2106.08295*. [https://arxiv.org/abs/2106.08295](https://arxiv.org/abs/2106.08295)

Shapiro, M., Preguiça, N., Baquero, C., & Zawirski, M. (2011). Conflict-Free Replicated Data Types. *Proceedings of the 13th International Conference on Stabilization, Safety, and Security of Distributed Systems*. [https://hal.inria.fr/inria-00609399/document](https://hal.inria.fr/inria-00609399/document)

Touvron, H., Martin, L., Stone, K., et al. (2023). Llama 2: Open Foundation and Fine-Tuned Chat Models. *arXiv preprint arXiv:2307.09288*. [https://arxiv.org/abs/2307.09288](https://arxiv.org/abs/2307.09288)

Yu, D., Naik, S., Backurs, A., et al. (2022). Differentially Private Fine-tuning of Language Models. *ICLR 2022*. [https://arxiv.org/abs/2210.00038](https://arxiv.org/abs/2210.00038)

Zhang, J., Vahidian, S., Kuo, M., et al. (2023). Towards Building the Federatedgpt: Federated Instruction Tuning. *arXiv preprint arXiv:2305.05644*. [https://arxiv.org/abs/2305.05644](https://arxiv.org/abs/2305.05644)

---

## Practitioner Resources

### Inference Engines

- **llama.cpp** ([github.com/ggerganov/llama.cpp](https://github.com/ggerganov/llama.cpp)) — The foundational C/C++ inference engine for GGUF models. Supports CPU, CUDA, Metal, Vulkan, and SYCL backends. The most portable and widely supported option for running quantized LLMs on consumer hardware.

- **Ollama** ([ollama.com](https://ollama.com)) — User-friendly wrapper around llama.cpp with model registry, automatic format selection, and REST API. Simplifies local model management on macOS and Linux. Recommended entry point for practitioners new to local inference.

- **LM Studio** ([lmstudio.ai](https://lmstudio.ai)) — GUI application for downloading, managing, and chatting with local models. Built on llama.cpp with a polished interface. Supports GGUF model discovery from Hugging Face.

- **MLX** ([github.com/ml-explore/mlx](https://github.com/ml-explore/mlx)) — Apple's array framework optimized for Apple Silicon unified memory. The mlx-lm package provides LLM inference and QLoRA fine-tuning with performance advantages over llama.cpp on Apple hardware for larger models.

- **ExecuTorch** ([pytorch.org/executorch](https://pytorch.org/executorch/)) — Meta's on-device inference framework for PyTorch models. Targets mobile and embedded deployment with pluggable hardware backends (CoreML, QNN, XNNPACK).

- **MLC-LLM** ([github.com/mlc-ai/mlc-llm](https://github.com/mlc-ai/mlc-llm)) — Compiler-based LLM deployment using Apache TVM. Generates optimized kernels for CUDA, Metal, Vulkan, OpenCL, and WebGPU from a single model definition.

### Quantization Tools

- **AutoGPTQ** ([github.com/AutoGPTQ/AutoGPTQ](https://github.com/AutoGPTQ/AutoGPTQ)) — Python library implementing GPTQ quantization for Hugging Face Transformers models. Supports 2-8 bit quantization with calibration dataset optimization.

- **AutoAWQ** ([github.com/casper-hansen/AutoAWQ](https://github.com/casper-hansen/AutoAWQ)) — Implementation of Activation-Aware Weight Quantization. Faster quantization than GPTQ with comparable quality. Integrates with Hugging Face Transformers.

- **bitsandbytes** ([github.com/TimDettmers/bitsandbytes](https://github.com/TimDettmers/bitsandbytes)) — Library providing NF4 and INT8 quantization kernels for QLoRA fine-tuning. Required for the QLoRA workflow with Hugging Face PEFT.

- **Unsloth** ([github.com/unslothai/unsloth](https://github.com/unslothai/unsloth)) — Optimized LoRA/QLoRA fine-tuning with rewritten attention kernels. Reduces memory usage by 50-70% compared to standard PEFT, enabling larger model fine-tuning on consumer GPUs.

### Local Knowledge and Retrieval

- **SQLite-vec** ([github.com/asg017/sqlite-vec](https://github.com/asg017/sqlite-vec)) — Vector search extension for SQLite. Stores embeddings alongside relational data in a single SQLite database. Suitable for applications that already use SQLite for data persistence.

- **LanceDB** ([github.com/lancedb/lancedb](https://github.com/lancedb/lancedb)) — Embedded vector database built on the Lance columnar format. Supports HNSW indexing, vector quantization, and hybrid search. No server process required.

- **Chroma** ([github.com/chroma-core/chroma](https://github.com/chroma-core/chroma)) — Embedding database for RAG applications. Embedded mode stores data locally with HNSW indexing. Simple API with built-in embedding function support.

- **FAISS** ([github.com/facebookresearch/faiss](https://github.com/facebookresearch/faiss)) — Mature vector search library from Meta. Comprehensive index types including IVF-PQ for memory-constrained environments. C++ core with Python bindings.

### Local-First Synchronization

- **Automerge** ([automerge.org](https://automerge.org)) — CRDT library for local-first applications. JSON-like document model with automatic conflict resolution. Reference implementation of the Ink & Switch local-first principles.

- **Yjs** ([github.com/yjs/yjs](https://github.com/yjs/yjs)) — High-performance CRDT implementation optimized for real-time collaborative editing. Extensive editor bindings (ProseMirror, CodeMirror, Monaco, Quill).

- **CR-SQLite** ([github.com/vlcn-io/cr-sqlite](https://github.com/vlcn-io/cr-sqlite)) — SQLite extension adding CRDT merge semantics to tables. Enables conflict-free synchronization of SQLite databases across devices.

- **Evolu** ([github.com/evoluhq/evolu](https://github.com/evoluhq/evolu)) — Local-first framework combining CR-SQLite with end-to-end encryption. Designed for privacy-first applications where the sync server cannot read user data.

- **PowerSync** ([powersync.com](https://www.powersync.com)) — Synchronization layer between local SQLite and PostgreSQL. Supports React Native, Flutter, and web platforms.

### Integrated Local AI Systems

- **Khoj** ([github.com/khoj-ai/khoj](https://github.com/khoj-ai/khoj)) — Open-source self-hosted AI assistant that indexes personal notes, documents, and code. Provides natural language search and chat grounded in user data. Supports Obsidian, Org-mode, and plaintext.

- **Private-GPT** ([github.com/zylon-ai/private-gpt](https://github.com/zylon-ai/private-gpt)) — Local RAG system for document Q&A. Processes documents entirely on-device using llama.cpp and local embeddings.

### Federated Learning

- **Flower** ([flower.ai](https://flower.ai)) — Open-source federated learning framework. Supports PyTorch, TensorFlow, and JAX with pluggable aggregation strategies. The most widely used FL framework for research and production.

- **OpenFedLLM** ([github.com/rui-ye/OpenFedLLM](https://github.com/rui-ye/OpenFedLLM)) — Federated instruction tuning framework for LLMs. Demonstrates LoRA-based federated fine-tuning of 7B+ models.

### Privacy Tools

- **Opacus** ([opacus.ai](https://opacus.ai)) — Meta's library for training PyTorch models with differential privacy (DP-SGD). Includes privacy accountant for tracking cumulative epsilon.

- **PySyft** ([github.com/OpenMined/PySyft](https://github.com/OpenMined/PySyft)) — Privacy-preserving computation framework supporting FL, secure aggregation, and differential privacy. Developed by the OpenMined community.
